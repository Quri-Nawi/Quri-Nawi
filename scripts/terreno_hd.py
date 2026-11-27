"""Texturas de la maqueta 3D: datos de alta resolución, horneado en Blender y composición final.

Pasos (desde la raíz del repositorio):
  1. python scripts/terreno_hd.py descargar
  2. blender --background --factory-startup --python scripts/blender_terreno.py -- pasadas
  3. python scripts/terreno_hd.py componer
  4. blender --background --factory-startup --python scripts/blender_terreno.py -- portada

Fuentes: Terrain Tiles de Mapzen en AWS Open Data (zoom 9) y Sentinel-2 cloudless 2016 de EOX
(CC BY 4.0; las versiones posteriores tienen licencia no comercial y no deben sustituirla).
El tono general se iguala con la imagen NASA Blue Marble que el repositorio tenía antes
(dominio público, se lee del historial de git) para disimular las franjas entre órbitas.
Los archivos intermedios quedan en scripts/.cache (fuera del repositorio).
Requiere numpy y pillow. Probado con Blender 5.2.
"""
import io
import os
import subprocess
import sys
import urllib.parse
from xml.etree import ElementTree

import numpy as np
from PIL import Image, ImageFilter

import geodatos as geo

CACHE = os.path.join(geo.ROOT, "scripts", ".cache")
HD_WIDTH, HD_HEIGHT = 3704, 4096  # textura de escritorio
SD_WIDTH, SD_HEIGHT = 1852, 2048  # textura de celular y copia sin conexión
NORMAL_WIDTH, NORMAL_HEIGHT = 1300, 1440
# Respaldo de la referencia de tono en el historial del repositorio.
BLUE_MARBLE = "27ceeb3:public/geo/satelite.jpg"
EOX = "https://tiles.maps.eox.at/wms?"
LAYER = "s2cloudless"
DEM_ZOOM = 9
EXAGGERATION = 11 / 111_000  # igual que en src/components/basin-scene.ts
Image.MAX_IMAGE_PIXELS = None


def check_layer():
    """Detiene la descarga si la capa ya no es la de 2016 con licencia CC BY 4.0."""
    root = ElementTree.fromstring(geo.fetch(EOX + "service=WMS&request=GetCapabilities&version=1.1.1"))
    layer = next((item for item in root.iter("Layer") if item.findtext("Name") == LAYER), None)
    title = "" if layer is None else layer.findtext("Title") or ""
    abstract = "" if layer is None else layer.findtext("Abstract") or ""
    if "for 2016" not in title or "licenses/by/4.0" not in abstract:
        raise SystemExit(f"La capa {LAYER} ya no es la de 2016 con CC BY 4.0: {title!r}")
    print("capa:", title)


def download_reference():
    """NASA Blue Marble (dominio público), solo como referencia de tono."""
    query = urllib.parse.urlencode({
        "SERVICE": "WMS", "REQUEST": "GetMap", "VERSION": "1.3.0", "LAYERS": "BlueMarble_NextGeneration",
        "STYLES": "", "CRS": "EPSG:4326", "BBOX": f"{geo.SOUTH},{geo.WEST},{geo.NORTH},{geo.EAST}",
        "WIDTH": SD_WIDTH, "HEIGHT": SD_HEIGHT, "FORMAT": "image/jpeg",
    })
    data = geo.fetch("https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?" + query)
    with open(os.path.join(CACHE, "referencia.jpg"), "wb") as file:
        file.write(data)


def download():
    os.makedirs(CACHE, exist_ok=True)
    check_layer()
    download_reference()
    heights = geo.elevation_grid(NORMAL_WIDTH, NORMAL_HEIGHT, DEM_ZOOM, os.path.join(CACHE, "teselas"))
    np.save(os.path.join(CACHE, "alturas.npy"), heights.astype(np.float32))
    print("relieve (m):", int(heights.min()), int(heights.max()))

    # El servicio limita el tamaño por petición: la imagen se pide en 2 x 2 recortes.
    mosaic = Image.new("RGB", (HD_WIDTH, HD_HEIGHT))
    dlon, dlat = (geo.EAST - geo.WEST) / 2, (geo.NORTH - geo.SOUTH) / 2
    for row in range(2):
        for col in range(2):
            west, north = geo.WEST + col * dlon, geo.NORTH - row * dlat
            query = urllib.parse.urlencode({
                "SERVICE": "WMS", "REQUEST": "GetMap", "VERSION": "1.1.1", "LAYERS": LAYER, "STYLES": "",
                "SRS": "EPSG:4326", "BBOX": f"{west},{north - dlat},{west + dlon},{north}",
                "WIDTH": HD_WIDTH // 2, "HEIGHT": HD_HEIGHT // 2, "FORMAT": "image/jpeg",
            })
            data = geo.fetch(EOX + query)
            if not data.startswith(b"\xff\xd8"):
                raise SystemExit("El servicio no devolvió una imagen: " + data[:400].decode("utf-8", "replace"))
            mosaic.paste(Image.open(io.BytesIO(data)).convert("RGB"), (col * HD_WIDTH // 2, row * HD_HEIGHT // 2))
            print("recorte satelital", row, col, len(data) // 1024, "KB")
    mosaic.save(os.path.join(CACHE, "sentinel.png"))


def resized(array, width, height):
    return np.asarray(Image.fromarray(array.astype(np.float32), mode="F").resize((width, height), Image.BICUBIC))


def smoothstep(low, high, value):
    t = np.clip((value - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


def even_tone(color):
    """Iguala el tono a gran escala con Blue Marble y conserva el detalle fino de Sentinel-2."""
    path = os.path.join(CACHE, "referencia.jpg")
    if os.path.exists(path):
        reference = Image.open(path).convert("RGB")
    else:
        blob = subprocess.run(["git", "show", BLUE_MARBLE], cwd=geo.ROOT, capture_output=True, check=True).stdout
        reference = Image.open(io.BytesIO(blob)).convert("RGB")
    small = (HD_WIDTH // 8, HD_HEIGHT // 8)

    def low(image):
        blurred = image.resize(small, Image.BOX).filter(ImageFilter.GaussianBlur(7))
        return np.asarray(blurred.resize((HD_WIDTH, HD_HEIGHT), Image.BICUBIC), dtype=np.float32) / 255

    source = Image.fromarray(np.round(color * 255).astype(np.uint8))
    gain = (low(reference) + 0.03) / (low(source) + 0.03)
    return np.clip(color * np.power(np.clip(gain, 0.5, 2.0), 0.75), 0, 1)


def build_normals(heights):
    """Normales en el espacio del objeto de Three.js: x = este, y = arriba, z = sur."""
    h = heights * EXAGGERATION
    lat_center = np.radians((geo.NORTH + geo.SOUTH) / 2)
    step_x = (geo.EAST - geo.WEST) * np.cos(lat_center) / NORMAL_WIDTH
    step_z = (geo.NORTH - geo.SOUTH) / NORMAL_HEIGHT
    dz, dx = np.gradient(h, step_z, step_x)
    normal = np.dstack([-dx, np.ones_like(h), -dz])
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    image = Image.fromarray(np.round((normal * 0.5 + 0.5) * 255).astype(np.uint8))
    image.save(os.path.join(geo.OUT, "normales.jpg"), quality=82, optimize=True, subsampling=0)


def compose():
    heights = np.load(os.path.join(CACHE, "alturas.npy"))

    def pass_image(name):
        image = Image.open(os.path.join(CACHE, name + ".png")).convert("L")
        return np.asarray(image.resize((HD_WIDTH, HD_HEIGHT), Image.BICUBIC), dtype=np.float32) / 255

    occlusion = pass_image("oclusion")
    shadow = pass_image("sombra")
    color = np.asarray(Image.open(os.path.join(CACHE, "sentinel.png")), dtype=np.float32) / 255

    color = even_tone(color)

    # Curva suave: abre las sombras de la selva sin quemar la nieve ni los salares.
    color = np.power(color, 0.68)
    luma = (color @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    color = luma + (color - luma) * 1.12

    # Tinte por altura: verde en la llanura, ocre cálido en la cordillera. Solo color; el relieve no se altera.
    altitude = resized(heights, HD_WIDTH, HD_HEIGHT)
    highland = smoothstep(900, 3800, altitude)[..., None].astype(np.float32)
    lowland_tint = np.array([0.97, 1.04, 0.97], dtype=np.float32)
    highland_tint = np.array([1.09, 1.01, 0.91], dtype=np.float32)
    color = color * (lowland_tint * (1 - highland) + highland_tint * highland)

    # Oclusión y sombras proyectadas horneadas en Blender. La luz directa la calcula la web con las normales.
    color *= (0.74 + 0.26 * occlusion)[..., None]
    color *= (0.86 + 0.14 * shadow)[..., None] * np.array([1.0, 1.0, 1.02], dtype=np.float32)

    final = Image.fromarray(np.round(np.clip(color, 0, 1) * 255).astype(np.uint8))
    final.save(os.path.join(geo.OUT, "satelite-hd.jpg"), quality=76, optimize=True, progressive=True)
    final.resize((SD_WIDTH, SD_HEIGHT), Image.LANCZOS).save(os.path.join(geo.OUT, "satelite.jpg"), quality=78, optimize=True, progressive=True)
    build_normals(heights)
    for name in ("satelite-hd.jpg", "satelite.jpg", "normales.jpg"):
        print(name, os.path.getsize(os.path.join(geo.OUT, name)) // 1024, "KB")


if __name__ == "__main__":
    step = sys.argv[1] if len(sys.argv) > 1 else ""
    if step == "descargar":
        download()
    elif step == "componer":
        compose()
    else:
        raise SystemExit(__doc__)
