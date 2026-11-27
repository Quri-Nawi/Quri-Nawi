"""Maqueta de la cuenca en Blender (Cycles). Ver los pasos en scripts/terreno_hd.py.

  blender --background --factory-startup --python scripts/blender_terreno.py -- pasadas
  blender --background --factory-startup --python scripts/blender_terreno.py -- portada

"pasadas" hornea en vista cenital la oclusión ambiental y las sombras proyectadas del relieve real.
"portada" genera docs/assets/maqueta-blender.jpg y guarda scripts/.cache/maqueta.blend.
Probado con Blender 5.2.
Ejes: X = este, Y = norte, Z = arriba; las mismas unidades que la escena web (1 = 1° de latitud).
"""
import json
import math
import os
import sys

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", ".cache")
GEO = os.path.join(ROOT, "public", "geo")
EXAGGERATION = 11 / 111_000
BASE = -0.16

with open(os.path.join(GEO, "rios.json"), encoding="utf-8") as file:
    DATA = json.load(file)
B = DATA["bounds"]
LON_C, LAT_C = (B["west"] + B["east"]) / 2, (B["north"] + B["south"]) / 2
KX = math.cos(math.radians(LAT_C))
SIZE_X, SIZE_Y = (B["east"] - B["west"]) * KX, B["north"] - B["south"]
HEIGHTS = np.load(os.path.join(CACHE, "alturas.npy"))  # fila 0 = norte
ROWS, COLS = HEIGHTS.shape


def clean_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def setup_cycles(samples):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    device = "CPU"
    for kind in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            device = "GPU"
            print("Cycles en GPU:", kind, [d.name for d in gpus])
            break
    scene.cycles.device = device
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    return scene


def mesh_object(name, vertices, faces, uvs=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    if uvs is not None:
        layer = mesh.uv_layers.new(name="UVMap")
        loop_vertex = np.empty(len(mesh.loops), dtype=np.int32)
        mesh.loops.foreach_get("vertex_index", loop_vertex)
        layer.data.foreach_set("uv", uvs[loop_vertex].astype(np.float32).ravel())
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def grid_points():
    x = np.linspace(-SIZE_X / 2, SIZE_X / 2, COLS)
    y = np.linspace(SIZE_Y / 2, -SIZE_Y / 2, ROWS)
    gx, gy = np.meshgrid(x, y)
    return np.dstack([gx, gy, HEIGHTS * EXAGGERATION])


def build_terrain():
    points = grid_points()
    index = np.arange(ROWS * COLS).reshape(ROWS, COLS)
    faces = np.stack([index[:-1, :-1], index[1:, :-1], index[1:, 1:], index[:-1, 1:]], axis=-1).reshape(-1, 4)
    u, v = np.meshgrid(np.linspace(0, 1, COLS), np.linspace(1, 0, ROWS))
    uvs = np.dstack([u, v]).reshape(-1, 2)
    terrain = mesh_object("terreno", points.reshape(-1, 3).tolist(), faces.tolist(), uvs)
    terrain.data.polygons.foreach_set("use_smooth", np.ones(len(terrain.data.polygons), dtype=bool))
    return terrain


def material(name, build):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    output = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(build(tree), output.inputs["Surface"])
    return mat


def emission(color, strength=1.0):
    def build(tree):
        node = tree.nodes.new("ShaderNodeEmission")
        node.inputs["Color"].default_value = (*color, 1)
        node.inputs["Strength"].default_value = strength
        return node.outputs["Emission"]
    return build


def set_world(color, strength):
    world = bpy.data.worlds.new("mundo")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (*color, 1)
    background.inputs["Strength"].default_value = strength


def add_sun(strength, direction, color=(1, 1, 1), angle=3.0):
    light = bpy.data.lights.new("sol", "SUN")
    light.energy = strength
    light.color = color
    light.angle = math.radians(angle)
    sun = bpy.data.objects.new("sol", light)
    sun.rotation_euler = Vector(direction).normalized().to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(sun)
    return light


def render_to(path, file_format="PNG", color_mode="RGB", depth="8"):
    scene = bpy.context.scene
    settings = scene.render.image_settings
    settings.file_format = file_format
    settings.color_mode = color_mode
    settings.color_depth = depth
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def read_gray(path):
    image = bpy.data.images.load(path)
    image.colorspace_settings.name = "Non-Color"
    width, height = image.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    bpy.data.images.remove(image)
    return pixels.reshape(height, width, 4)[..., 0]


def write_gray(path, values):
    height, width = values.shape
    image = bpy.data.images.new("gris", width, height, alpha=True)
    image.colorspace_settings.name = "Non-Color"
    rgba = np.ones((height, width, 4), dtype=np.float32)
    rgba[..., :3] = values[..., None]
    image.pixels.foreach_set(rgba.ravel())
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()


def passes():
    clean_scene()
    scene = setup_cycles(40)
    terrain = build_terrain()
    set_world((0, 0, 0), 0)
    scene.view_settings.view_transform = "Raw"

    camera_data = bpy.data.cameras.new("cenital")
    camera_data.type = "ORTHO"
    camera_data.sensor_fit = "VERTICAL"
    camera_data.ortho_scale = SIZE_Y
    camera = bpy.data.objects.new("cenital", camera_data)
    camera.location = (0, 0, 10)
    scene.collection.objects.link(camera)
    scene.camera = camera
    width, height = 1852, 2048
    scene.render.resolution_x, scene.render.resolution_y = width, height
    # Blender no admite proporciones de píxel menores que 1: se estira el eje Y para cubrir exactamente el bloque.
    scene.render.pixel_aspect_y = SIZE_Y * width / (SIZE_X * height)

    def occlusion(tree):
        ao = tree.nodes.new("ShaderNodeAmbientOcclusion")
        ao.inputs["Distance"].default_value = 0.14
        ao.samples = 8
        node = tree.nodes.new("ShaderNodeEmission")
        tree.links.new(ao.outputs["AO"], node.inputs["Color"])
        return node.outputs["Emission"]

    terrain.data.materials.append(material("oclusion", occlusion))
    render_to(os.path.join(CACHE, "oclusion.png"))

    def white(tree):
        node = tree.nodes.new("ShaderNodeBsdfDiffuse")
        node.inputs["Color"].default_value = (0.8, 0.8, 0.8, 1)
        return node.outputs["BSDF"]

    terrain.data.materials[0] = material("blanco", white)
    scene.cycles.max_bounces = 0
    scene.cycles.diffuse_bounces = 0
    # Sol del noroeste, la convención de sombreado cartográfico.
    sun = add_sun(3.0, (-0.62, 0.62, 0.48), angle=4.0)
    lit_path, free_path = os.path.join(CACHE, "sol_con.exr"), os.path.join(CACHE, "sol_sin.exr")
    render_to(lit_path, "OPEN_EXR", depth="32")
    sun.use_shadow = False
    render_to(free_path, "OPEN_EXR", depth="32")
    lit, free = read_gray(lit_path), read_gray(free_path)
    shadow = np.where(free > 0.03, np.clip(lit / np.maximum(free, 1e-4), 0, 1), 1.0)
    print("cobertura iluminada:", round(float((free > 0.03).mean()), 3), "sombra media:", round(float(shadow.mean()), 3))
    write_gray(os.path.join(CACHE, "sombra.png"), shadow.astype(np.float32))


def height_at(lon, lat):
    u = np.clip((lon - B["west"]) / (B["east"] - B["west"]) * (COLS - 1), 0, COLS - 1.001)
    v = np.clip((B["north"] - lat) / (B["north"] - B["south"]) * (ROWS - 1), 0, ROWS - 1.001)
    i, j = int(u), int(v)
    fu, fv = u - i, v - j
    top = HEIGHTS[j, i] * (1 - fu) + HEIGHTS[j, i + 1] * fu
    bottom = HEIGHTS[j + 1, i] * (1 - fu) + HEIGHTS[j + 1, i + 1] * fu
    return float(top * (1 - fv) + bottom * fv) * EXAGGERATION


def add_rivers(featured):
    gold = material("rio_oro", emission((1.0, 0.45, 0.02), 1.5))
    blue = material("rio_azul", emission((0.08, 0.45, 1.0), 1.3))
    for river in DATA["rivers"]:
        highlighted = river["name"] in featured
        curve = bpy.data.curves.new("rio " + river["name"], "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = 0.012 if highlighted else 0.008
        curve.bevel_resolution = 3
        for segment in river["segments"]:
            points = []
            for (a0, a1), (b0, b1) in zip(segment, segment[1:]):
                steps = max(1, math.ceil(math.hypot((b0 - a0) * KX, b1 - a1) / 0.008))
                points += [(a0 + (b0 - a0) * s / steps, a1 + (b1 - a1) * s / steps) for s in range(steps)]
            points.append(tuple(segment[-1]))
            spline = curve.splines.new("POLY")
            spline.points.add(len(points) - 1)
            for k, (lon, lat) in enumerate(points):
                spline.points[k].co = ((lon - LON_C) * KX, lat - LAT_C, height_at(lon, lat) + 0.028, 1)
        curve.materials.append(gold if highlighted else blue)
        bpy.context.scene.collection.objects.link(bpy.data.objects.new(curve.name, curve))


def add_walls():
    """Costados del bloque con vetas horizontales, como un corte de maqueta."""
    points = grid_points()
    edges = [points[0, :], points[:, -1], points[-1, ::-1], points[::-1, 0]]

    def strata(tree):
        coords = tree.nodes.new("ShaderNodeNewGeometry")
        separate = tree.nodes.new("ShaderNodeSeparateXYZ")
        tree.links.new(coords.outputs["Position"], separate.inputs[0])
        scale = tree.nodes.new("ShaderNodeMapRange")
        scale.inputs["From Min"].default_value = BASE
        scale.inputs["From Max"].default_value = 0.2
        tree.links.new(separate.outputs["Z"], scale.inputs["Value"])
        ramp = tree.nodes.new("ShaderNodeValToRGB")
        stops = [(0.0, (0.012, 0.008, 0.005)), (0.3, (0.045, 0.025, 0.012)), (0.38, (0.028, 0.017, 0.01)), (0.62, (0.085, 0.048, 0.022)), (1.0, (0.14, 0.085, 0.04))]
        elements = ramp.color_ramp.elements
        elements[0].position, elements[0].color = stops[0][0], (*stops[0][1], 1)
        elements[1].position, elements[1].color = stops[-1][0], (*stops[-1][1], 1)
        for position, color in stops[1:-1]:
            elements.new(position).color = (*color, 1)
        tree.links.new(scale.outputs["Result"], ramp.inputs["Fac"])
        node = tree.nodes.new("ShaderNodeBsdfDiffuse")
        tree.links.new(ramp.outputs["Color"], node.inputs["Color"])
        return node.outputs["BSDF"]

    wall = material("estratos", strata)
    for number, line in enumerate(edges):
        count = len(line)
        bottom = line.copy()
        bottom[:, 2] = BASE
        vertices = np.concatenate([line, bottom]).tolist()
        faces = [(k, k + 1, count + k + 1, count + k) for k in range(count - 1)]
        mesh_object(f"pared {number}", vertices, faces).data.materials.append(wall)


def frame_block(scene, camera, direction, margin=0.04):
    """Centra el bloque completo y acerca la cámara hasta dejar solo el margen pedido."""
    top = float(HEIGHTS.max()) * EXAGGERATION
    outline = grid_points()[::40, ::40].reshape(-1, 3).tolist()
    outline += [(sx * SIZE_X / 2, sy * SIZE_Y / 2, z) for sx in (-1, 1) for sy in (-1, 1) for z in (BASE, 0.0)]
    target = Vector((0.0, 0.0, top / 3))
    distance = 30.0
    for _ in range(60):
        camera.location = target + direction * distance
        bpy.context.view_layer.update()
        seen = [world_to_camera_view(scene, camera, Vector(p)) for p in outline]
        xs, ys = [p.x for p in seen], [p.y for p in seen]
        # Desplaza el encuadre hacia el centro de lo visible y corrige la distancia.
        camera.data.shift_x += (min(xs) + max(xs)) / 2 - 0.5
        camera.data.shift_y += ((min(ys) + max(ys)) / 2 - 0.5) * 9 / 16
        fill = max(max(xs) - min(xs), max(ys) - min(ys))
        distance *= 1 + (fill / (1 - 2 * margin) - 1) * 0.6


def cover():
    clean_scene()
    scene = setup_cycles(160)
    terrain = build_terrain()

    def ground(tree):
        image = tree.nodes.new("ShaderNodeTexImage")
        image.image = bpy.data.images.load(os.path.join(GEO, "satelite-hd.jpg"))
        image.extension = "EXTEND"
        node = tree.nodes.new("ShaderNodeBsdfPrincipled")
        node.inputs["Roughness"].default_value = 0.92
        node.inputs["Specular IOR Level"].default_value = 0.12
        tree.links.new(image.outputs["Color"], node.inputs["Base Color"])
        return node.outputs["BSDF"]

    terrain.data.materials.append(material("suelo", ground))
    add_walls()
    featured = {"Beni", "Kaka", "Madre de Dios"}
    add_rivers(featured)
    set_world((0.35, 0.55, 0.62), 0.75)
    add_sun(4.6, (-0.62, 0.5, 0.55), color=(1.0, 0.9, 0.74), angle=2.0)
    add_sun(0.7, (0.8, -0.3, 0.5), color=(0.55, 0.72, 1.0), angle=20.0)

    # Fondo verde profundo de la portada: la película es transparente y se compone sobre un degradado.
    scene.render.film_transparent = True
    camera_data = bpy.data.cameras.new("portada")
    camera_data.lens = 62
    camera = bpy.data.objects.new("portada", camera_data)
    target = Vector((0.1, -0.35, 0.0))
    polar, azimuth = math.radians(54), math.radians(142)
    direction = Vector((math.sin(polar) * math.sin(azimuth), -math.sin(polar) * math.cos(azimuth), math.cos(polar)))
    camera.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    scene.collection.objects.link(camera)
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 2400, 1350
    frame_block(scene, camera, direction)
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.25
    foreground = os.path.join(CACHE, "portada.png")
    render_to(foreground, "PNG", "RGBA")

    image = bpy.data.images.load(foreground)
    width, height = image.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape(height, width, 4)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    radius = np.clip(np.hypot((xx - width * 0.5) / (width * 0.72), (yy - height * 0.55) / (height * 0.78)), 0, 1)[..., None]
    inner, outer = np.array([36, 80, 63], np.float32) / 255, np.array([6, 18, 13], np.float32) / 255
    backdrop = inner * (1 - radius) + outer * radius
    alpha = pixels[..., 3:4]
    pixels[..., :3] = pixels[..., :3] * alpha + backdrop * (1 - alpha)
    pixels[..., 3] = 1
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = os.path.join(ROOT, "docs", "assets", "maqueta-blender.jpg")
    image.file_format = "JPEG"
    image.save(quality=90)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CACHE, "maqueta.blend"), compress=True)


if __name__ == "__main__":
    step = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else ""
    if step == "pasadas":
        passes()
    elif step == "portada":
        cover()
    else:
        raise SystemExit(__doc__)
