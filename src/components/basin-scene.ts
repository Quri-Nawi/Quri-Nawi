import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type Geo = {
  bounds: { west: number; east: number; south: number; north: number; width: number; height: number };
  rivers: { name: string; segments: [number, number][][] }[];
  border: [number, number][][];
  places: { name: string; lon: number; lat: number }[];
};

export type Anchor = { id: string; lon: number; lat: number };

export type SceneOptions = {
  host: HTMLElement;
  geo: Geo;
  elevation: Uint16Array;
  texture: THREE.Texture;
  highlighted: ReadonlySet<string>;
  anchors: readonly Anchor[];
  reducedMotion: boolean;
  coarsePointer: boolean;
  onPick: (river: string | null) => void;
  onHover: (river: string | null, x: number, y: number) => void;
  onFrame: (project: (lon: number, lat: number, lift?: number) => { x: number; y: number; visible: boolean }) => void;
};

export type BasinScene = {
  focus: (river: string | null) => void;
  zoom: (factor: number) => void;
  setRotation: (on: boolean) => void;
  dispose: () => void;
};

const EXAGGERATION = 11 / 111_000; // unidades del mundo por metro: 1 unidad = 1° de latitud ≈ 111 km
const BASE = -0.16;
const OVERVIEW = { distance: 9, polar: 0.98 };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function dotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,.7)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createBasinScene(options: SceneOptions): BasinScene {
  const { host, geo, elevation, texture, highlighted } = options;
  const { west, east, south, north, width: W, height: H } = geo.bounds;
  const latC = (north + south) / 2;
  const lonC = (west + east) / 2;
  const kx = Math.cos((latC * Math.PI) / 180);
  const sizeX = (east - west) * kx;
  const sizeZ = north - south;

  const demHeight = (lon: number, lat: number) => {
    const u = Math.min(Math.max(((lon - west) / (east - west)) * W - 0.5, 0), W - 1.001);
    const v = Math.min(Math.max(((north - lat) / (north - south)) * H - 0.5, 0), H - 1.001);
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const at = (x: number, y: number) => elevation[y * W + x];
    return (at(i, j) * (1 - fu) + at(i + 1, j) * fu) * (1 - fv) + (at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu) * fv;
  };

  // Terreno: rejilla con la elevación real, exagerada para que se lea el relieve.
  const SX = 389, SZ = 431;
  const terrain = new THREE.PlaneGeometry(sizeX, sizeZ, SX, SZ);
  terrain.rotateX(-Math.PI / 2);
  const positions = terrain.attributes.position;
  const surface = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    const y = demHeight(lonC + positions.getX(i) / kx, latC - positions.getZ(i)) * EXAGGERATION;
    positions.setY(i, y);
    surface[i] = y;
  }
  terrain.computeVertexNormals();

  // Altura sobre la malla (no sobre el DEM) para que ríos y marcadores no queden enterrados en valles estrechos.
  const meshHeight = (lon: number, lat: number) => {
    const u = Math.min(Math.max(((lon - west) / (east - west)) * SX, 0), SX - 0.001);
    const v = Math.min(Math.max(((north - lat) / (north - south)) * SZ, 0), SZ - 0.001);
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const at = (x: number, y: number) => surface[y * (SX + 1) + x];
    return (at(i, j) * (1 - fu) + at(i + 1, j) * fu) * (1 - fv) + (at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu) * fv;
  };
  const world = (lon: number, lat: number, lift = 0) => new THREE.Vector3((lon - lonC) * kx, meshHeight(lon, lat) + lift, latC - lat);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const ground = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }));
  scene.add(ground);

  // Paredes del bloque, como una maqueta sobre la mesa.
  const wall: number[] = [];
  const edge = (indices: number[]) => {
    for (let k = 0; k < indices.length - 1; k++) {
      const a = indices[k], b = indices[k + 1];
      const ax = positions.getX(a), ay = positions.getY(a), az = positions.getZ(a);
      const bx = positions.getX(b), by = positions.getY(b), bz = positions.getZ(b);
      wall.push(ax, ay, az, bx, by, bz, ax, BASE, az, bx, by, bz, bx, BASE, bz, ax, BASE, az);
    }
  };
  const row = (r: number) => Array.from({ length: SX + 1 }, (_, c) => r * (SX + 1) + c);
  const col = (c: number) => Array.from({ length: SZ + 1 }, (_, r) => r * (SX + 1) + c);
  edge(row(0)); edge(row(SZ)); edge(col(0)); edge(col(SX));
  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3));
  wallGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(wallGeometry, new THREE.MeshStandardMaterial({ color: 0x3a2d1f, roughness: 1, side: THREE.DoubleSide })));

  const dot = dotTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(sizeX * 1.6, sizeZ * 1.6),
    new THREE.MeshBasicMaterial({ map: dot, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  shadow.rotateX(-Math.PI / 2);
  shadow.position.y = BASE - 0.02;
  scene.add(shadow);

  scene.add(new THREE.HemisphereLight(0xe8f3ff, 0x24301f, 1.7));
  const sun = new THREE.DirectionalLight(0xfff0d2, 2.6);
  sun.position.set(-3, 5, -4);
  scene.add(sun);

  // Frontera de Bolivia.
  const borderMaterial = new THREE.LineDashedMaterial({ color: 0xf3e2a6, dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.55 });
  for (const part of geo.border) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(part.map(([lon, lat]) => world(lon, lat, 0.01))), borderMaterial);
    line.computeLineDistances();
    scene.add(line);
  }

  // Ríos: núcleo, halo y un tubo invisible más ancho para que el clic sea fácil.
  type River = { name: string; core: THREE.MeshBasicMaterial; glow: THREE.MeshBasicMaterial; curves: THREE.CatmullRomCurve3[]; box: THREE.Box3; featured: boolean };
  const rivers = new Map<string, River>();
  const hits: THREE.Mesh[] = [];
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  for (const river of geo.rivers) {
    const featured = highlighted.has(river.name);
    const core = new THREE.MeshBasicMaterial({ color: featured ? 0xffd36b : 0x8fdcff, transparent: true, opacity: 1 });
    const glow = new THREE.MeshBasicMaterial({ color: featured ? 0xffb938 : 0x58c4ff, transparent: true, opacity: featured ? 0.28 : 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    const entry: River = { name: river.name, core, glow, curves: [], box: new THREE.Box3(), featured };
    for (const segment of river.segments) {
      const points: THREE.Vector3[] = [];
      for (let k = 0; k < segment.length - 1; k++) {
        const [a0, a1] = segment[k], [b0, b1] = segment[k + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot((b0 - a0) * kx, b1 - a1) / 0.012));
        for (let s = 0; s < steps; s++) points.push(world(a0 + ((b0 - a0) * s) / steps, a1 + ((b1 - a1) * s) / steps, 0.012));
      }
      const [lastLon, lastLat] = segment[segment.length - 1];
      points.push(world(lastLon, lastLat, 0.012));
      const curve = new THREE.CatmullRomCurve3(points);
      const detail = Math.min(points.length * 2, 1600);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, detail, featured ? 0.0075 : 0.0055, 6), core));
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, detail, featured ? 0.02 : 0.014, 6), glow));
      const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(points.length, 500), 0.055, 5), hitMaterial);
      hit.userData.river = river.name;
      hits.push(hit);
      scene.add(hit);
      entry.curves.push(curve);
      points.forEach((point) => entry.box.expandByPoint(point));
    }
    rivers.set(river.name, entry);
  }

  // Corriente de luz sobre los ríos que ya tienen fichas.
  const flowCurves = [...rivers.values()].filter((river) => river.featured).flatMap((river) => river.curves);
  const flowLengths = flowCurves.map((curve) => curve.getLength());
  const particles = flowCurves.flatMap((_, index) => {
    const count = Math.max(6, Math.round(flowLengths[index] * 9));
    return Array.from({ length: count }, (__, k) => ({ curve: index, t: k / count }));
  });
  const flowGeometry = new THREE.BufferGeometry();
  flowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(particles.length * 3), 3));
  const flow = new THREE.Points(flowGeometry, new THREE.PointsMaterial({ map: dot, color: 0xfff0b8, size: 0.06, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(flow);

  // Marcadores: haz de luz sobre el lugar aproximado de cada estudio.
  const pins: { ring: THREE.Mesh; phase: number }[] = [];
  const seen = new Set<string>();
  for (const anchor of options.anchors) {
    const key = anchor.lon.toFixed(3) + anchor.lat.toFixed(3);
    if (seen.has(key)) continue;
    seen.add(key);
    const base = world(anchor.lon, anchor.lat, 0.01);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.26, 6), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.85 }));
    beam.position.copy(base).add(new THREE.Vector3(0, 0.13, 0));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2c4 }));
    head.position.copy(base).add(new THREE.Vector3(0, 0.27, 0));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.028, 40), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotateX(-Math.PI / 2);
    ring.position.copy(base);
    scene.add(beam, head, ring);
    pins.push({ ring, phase: pins.length * 0.7 });
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.25;
  controls.minDistance = 0.6;
  controls.maxDistance = 12;
  controls.autoRotateSpeed = 0.45;
  if (options.coarsePointer) {
    // Un dedo desplaza la página; dos dedos giran y acercan el mapa.
    controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
    renderer.domElement.style.touchAction = "pan-y";
  } else {
    controls.enableZoom = false; // la rueda sigue desplazando la página
  }
  const home = new THREE.Vector3(0, 0.05, 0.25);
  controls.target.copy(home);

  let rotating = !options.reducedMotion;
  let focused: string | null = null;
  let idleTimer = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; window.clearTimeout(idleTimer); });
  controls.addEventListener("end", () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => { controls.autoRotate = rotating && !focused; }, 5000);
  });

  const spherical = (distance: number, polar: number, azimuth: number, target: THREE.Vector3) =>
    new THREE.Vector3().setFromSphericalCoords(distance, polar, azimuth).add(target);

  type Tween = { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number; duration: number };
  let tween: Tween | null = null;
  const flyTo = (target: THREE.Vector3, distance: number, polar: number, duration = 1600) => {
    const offset = camera.position.clone().sub(controls.target);
    const azimuth = Math.atan2(offset.x, offset.z);
    const to = spherical(distance, polar, azimuth, target);
    if (options.reducedMotion || duration === 0) {
      camera.position.copy(to);
      controls.target.copy(target);
      tween = null;
      return;
    }
    tween = { from: camera.position.clone(), to, fromTarget: controls.target.clone(), toTarget: target.clone(), start: performance.now(), duration };
  };

  // Entrada: de una vista cenital a la maqueta inclinada.
  camera.position.copy(spherical(12, 0.12, 0.4, home));
  controls.target.copy(home);
  flyTo(home, OVERVIEW.distance, OVERVIEW.polar, 2600);
  controls.autoRotate = false;
  const introDone = window.setTimeout(() => { controls.autoRotate = rotating && !focused; }, options.reducedMotion ? 0 : 2600);

  const setOpacity = () => {
    for (const river of rivers.values()) {
      const active = !focused || river.name === focused;
      river.core.opacity = active ? 1 : 0.35;
      river.glow.opacity = active ? (river.featured || focused ? 0.34 : 0.16) : 0.05;
    }
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pick = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return (raycaster.intersectObjects(hits, false)[0]?.object.userData.river as string | undefined) ?? null;
  };
  let down: { x: number; y: number } | null = null;
  let hovered: string | null = null;
  const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
  const onUp = (event: PointerEvent) => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6) options.onPick(pick(event));
    down = null;
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.buttons) return;
    const river = pick(event);
    if (river !== hovered) renderer.domElement.style.cursor = river ? "pointer" : "grab";
    hovered = river;
    const rect = renderer.domElement.getBoundingClientRect();
    options.onHover(river, event.clientX - rect.left, event.clientY - rect.top);
  };
  const onLeave = () => { hovered = null; options.onHover(null, 0, 0); };
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerleave", onLeave);

  // Desplaza el encuadre para que el texto de la portada no tape la cuenca: a la derecha en escritorio, arriba en celular.
  const shift = { x: 0, y: 0 };
  const shiftGoal = () => {
    const portrait = camera.aspect < 0.8;
    if (focused) return portrait ? { x: 0, y: 0.26 } : { x: 0, y: 0.06 };
    return portrait ? { x: 0, y: 0.2 } : { x: -0.15, y: 0.02 };
  };
  const applyShift = () => {
    const { width, height } = host.getBoundingClientRect();
    camera.setViewOffset(width, height, shift.x * width, shift.y * height, width, height);
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    // En pantallas verticales la maqueta necesita más distancia para caber.
    camera.fov = camera.aspect < 0.8 ? 52 : 36;
    Object.assign(shift, shiftGoal());
    applyShift();
  };
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  resize();

  let visible = true;
  const watcher = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  watcher.observe(host);

  const projector = new THREE.Vector3();
  const project = (lon: number, lat: number, lift = 0.27) => {
    projector.copy(world(lon, lat, lift)).project(camera);
    const { width, height } = renderer.domElement.getBoundingClientRect();
    return { x: ((projector.x + 1) / 2) * width, y: ((1 - projector.y) / 2) * height, visible: projector.z < 1 && Math.abs(projector.x) < 1.2 && Math.abs(projector.y) < 1.2 };
  };

  const clock = new THREE.Clock();
  const flowPositions = flowGeometry.attributes.position as THREE.BufferAttribute;
  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    const delta = Math.min(clock.getDelta(), 0.1);
    if (!visible || document.hidden) return;
    if (tween) {
      const t = Math.min((performance.now() - tween.start) / tween.duration, 1);
      const k = ease(t);
      camera.position.lerpVectors(tween.from, tween.to, k);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
      if (t === 1) tween = null;
    }
    controls.update(delta);
    const goal = shiftGoal();
    if (Math.abs(goal.x - shift.x) + Math.abs(goal.y - shift.y) > 0.0005) {
      const k = options.reducedMotion ? 1 : Math.min(delta * 3, 1);
      shift.x += (goal.x - shift.x) * k;
      shift.y += (goal.y - shift.y) * k;
      applyShift();
    }
    if (!options.reducedMotion) {
      particles.forEach((particle, index) => {
        particle.t = (particle.t + (delta * 0.12) / flowLengths[particle.curve]) % 1;
        const point = flowCurves[particle.curve].getPointAt(particle.t);
        flowPositions.setXYZ(index, point.x, point.y + 0.012, point.z);
      });
      flowPositions.needsUpdate = true;
      const time = performance.now() / 1000;
      for (const pin of pins) {
        const phase = (time * 0.8 + pin.phase) % 1;
        pin.ring.scale.setScalar(1 + phase * 2.4);
        (pin.ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - phase);
      }
    }
    renderer.render(scene, camera);
    options.onFrame(project);
  };
  loop();

  return {
    focus(name) {
      focused = name && rivers.has(name) ? name : null;
      setOpacity();
      window.clearTimeout(idleTimer);
      if (!focused) {
        flyTo(home, OVERVIEW.distance, OVERVIEW.polar);
        controls.autoRotate = rotating;
        return;
      }
      controls.autoRotate = false;
      const box = rivers.get(focused)!.box;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      flyTo(center, Math.min(Math.max(Math.hypot(size.x, size.z) * 1.3, 1.9), 7.5), 0.86);
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target);
      const distance = Math.min(Math.max(offset.length() * factor, controls.minDistance), controls.maxDistance);
      flyTo(controls.target.clone(), distance, new THREE.Spherical().setFromVector3(offset).phi, 450);
    },
    setRotation(on) {
      rotating = on && !options.reducedMotion;
      controls.autoRotate = rotating && !focused;
    },
    dispose() {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.clearTimeout(introDone);
      resizer.disconnect();
      watcher.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(material) ? material : material ? [material] : []).forEach((item) => item.dispose());
      });
      texture.dispose();
      dot.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
