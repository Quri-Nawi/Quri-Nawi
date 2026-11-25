"""Genera los datos de la cuenca 3D en public/geo.

- relieve.bin: elevación en metros (Uint16, little-endian), rejilla lon/lat de ANCHO x ALTO.
  Fuente: Terrain Tiles de Mapzen en AWS Open Data (SRTM, GMTED, ETOPO1).
- satelite.jpg: NASA Blue Marble Next Generation vía GIBS (dominio público).
- rios.json: ríos de OpenStreetMap (ODbL) vía Nominatim, frontera de Natural Earth (dominio público) y ciudades.

Uso: python scripts/geodatos.py   (requiere numpy y pillow; descarga datos públicos).
"""
import io
import json
import math
import os
import time
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "geo")
WEST, EAST, SOUTH, NORTH = -70.0, -63.5, -17.2, -10.0
WIDTH, HEIGHT = 520, 576  # un píxel ≈ 0,0125° en ambos ejes
ZOOM = 8
AGENT = {"User-Agent": "quri-nawi-geodatos/0.1 (prototipo Gold4Good)"}

# Relaciones (R) y vías (W) de OpenStreetMap; los nombres se muestran en la app.
RIVERS = {
    "Kaka": "R5149858",
    "Beni": "R153814",
    "Alto Beni": "R2634347",
    "Madre de Dios": "R4512481",
    "Mamoré": "R240712",
    "Tuichi": "R1085594",
    "Coroico": "R4844031",
    "Orthon": "R253018",
    "Mapiri": "W249907282",
}
PLACES = {
    "La Paz": (-68.152, -16.496),
    "Guanay": (-67.883, -15.500),
    "Rurrenabaque": (-67.560, -14.460),
    "Riberalta": (-66.100, -10.983),
    "Trinidad": (-64.900, -14.833),
    "Cobija": (-68.769, -11.021),
}


def fetch(url, retries=4):
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=120) as response:
                return response.read()
        except OSError:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)


def tile_xy(lon, lat):
    n = 2 ** ZOOM
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def build_relief():
    x0, y0 = tile_xy(WEST, NORTH)
    x1, y1 = tile_xy(EAST, SOUTH)
    tx = range(int(x0), int(x1) + 1)
    ty = range(int(y0), int(y1) + 1)
    mosaic = np.zeros((len(ty) * 256, len(tx) * 256), dtype=np.float32)
    for j, y in enumerate(ty):
        for i, x in enumerate(tx):
            png = fetch(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png")
            rgb = np.asarray(Image.open(io.BytesIO(png)).convert("RGB")).astype(np.float32)
            mosaic[j * 256:(j + 1) * 256, i * 256:(i + 1) * 256] = rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256 - 32768
    lons = WEST + (np.arange(WIDTH) + 0.5) / WIDTH * (EAST - WEST)
    lats = NORTH - (np.arange(HEIGHT) + 0.5) / HEIGHT * (NORTH - SOUTH)
    px = (np.array([tile_xy(lon, 0)[0] for lon in lons]) - tx.start) * 256
    py = (np.array([tile_xy(WEST, lat)[1] for lat in lats]) - ty.start) * 256
    gx, gy = np.meshgrid(px, py)
    ix, iy = np.clip(gx.astype(int), 0, mosaic.shape[1] - 2), np.clip(gy.astype(int), 0, mosaic.shape[0] - 2)
    fx, fy = gx - ix, gy - iy
    top = mosaic[iy, ix] * (1 - fx) + mosaic[iy, ix + 1] * fx
    bottom = mosaic[iy + 1, ix] * (1 - fx) + mosaic[iy + 1, ix + 1] * fx
    elevation = np.clip(top * (1 - fy) + bottom * fy, 0, 65535).astype("<u2")
    elevation.tofile(os.path.join(OUT, "relieve.bin"))
    return int(elevation.min()), int(elevation.max())


def build_satellite():
    query = urllib.parse.urlencode({
        "SERVICE": "WMS", "REQUEST": "GetMap", "VERSION": "1.3.0", "LAYERS": "BlueMarble_NextGeneration",
        "STYLES": "", "CRS": "EPSG:4326", "BBOX": f"{SOUTH},{WEST},{NORTH},{EAST}",
        "WIDTH": 2048, "HEIGHT": 2268, "FORMAT": "image/jpeg",
    })
    image = Image.open(io.BytesIO(fetch("https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?" + query))).convert("RGB")
    image.save(os.path.join(OUT, "satelite.jpg"), quality=84, optimize=True, progressive=True)


def simplify(points, tolerance):
    if len(points) < 3:
        return points
    (ax, ay), (bx, by) = points[0], points[-1]
    length = math.hypot(bx - ax, by - ay) or 1e-12
    distances = [abs((by - ay) * x - (bx - ax) * y + bx * ay - by * ax) / length for x, y in points[1:-1]]
    index = max(range(len(distances)), key=distances.__getitem__) + 1
    if distances[index - 1] <= tolerance:
        return [points[0], points[-1]]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def clip(line):
    inside = lambda p: WEST <= p[0] <= EAST and SOUTH <= p[1] <= NORTH
    parts, current = [], []
    for point in line:
        if inside(point):
            current.append(point)
        elif current:
            parts.append(current)
            current = []
    return parts + ([current] if current else [])


def build_rivers():
    ids = ",".join(RIVERS.values())
    query = urllib.parse.urlencode({"osm_ids": ids, "format": "json", "polygon_geojson": 1})
    found = {item["osm_type"][0].upper() + str(item["osm_id"]): item["geojson"] for item in json.loads(fetch("https://nominatim.openstreetmap.org/lookup?" + query))}
    rivers = []
    for name, osm in RIVERS.items():
        geometry = found[osm]
        lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
        segments = []
        for line in lines:
            for part in clip(line):
                points = simplify(part, 0.003)
                if len(points) > 1:
                    segments.append([[round(x, 4), round(y, 4)] for x, y in points])
        rivers.append({"name": name, "osm": osm, "segments": segments})
    countries = json.loads(fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"))
    bolivia = next(f for f in countries["features"] if f["properties"].get("ADM0_A3") == "BOL")["geometry"]
    ring = max((polygon[0] for polygon in (bolivia["coordinates"] if bolivia["type"] == "MultiPolygon" else [bolivia["coordinates"]])), key=len)
    border = [[[round(x, 4), round(y, 4)] for x, y in simplify(part, 0.01)] for part in clip(ring)]
    data = {
        "bounds": {"west": WEST, "east": EAST, "south": SOUTH, "north": NORTH, "width": WIDTH, "height": HEIGHT},
        "rivers": rivers,
        "border": border,
        "places": [{"name": name, "lon": lon, "lat": lat} for name, (lon, lat) in PLACES.items()],
        "credits": "Ríos © colaboradores de OpenStreetMap (ODbL). Frontera: Natural Earth. Relieve: Terrain Tiles de Mapzen en AWS Open Data. Imagen: NASA Blue Marble.",
    }
    with open(os.path.join(OUT, "rios.json"), "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, separators=(",", ":"))
    return sum(len(r["segments"]) for r in rivers)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("relieve (m):", build_relief())
    build_satellite()
    print("tramos de río:", build_rivers())
