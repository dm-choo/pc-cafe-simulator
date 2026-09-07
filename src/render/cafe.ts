import * as THREE from "three";
import { COUNTER, ROOM, SEATS, localPoint } from "../content/cafe";

function canvasTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
export function buildCafe(scene: THREE.Scene) {
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  const texture = (
    w: number,
    h: number,
    paint: (c: CanvasRenderingContext2D) => void,
  ) => {
    const t = canvasTexture(w, h, paint);
    textures.push(t);
    return t;
  };
  const mat = (color: string, roughness = 0.7, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(m);
    return m;
  };
  const graphite = mat("#232b30"),
    desk = mat("#39302b", 0.62),
    edge = mat("#0e151b", 0.4, 0.45);
  const fabric = mat("#303a3d"),
    trim = mat("#adbbb9", 0.35, 0.7),
    wall = mat("#87827b");
  const warm = mat("#ddc0a1"),
    dark = mat("#141e25"),
    cream = mat("#d5d4c9");
  const teal = mat("#90cabc");
  teal.emissive.set("#619d91");
  teal.emissiveIntensity = 0.5;
  const light = mat("#fff5d5");
  light.emissive.set("#fff0ce");
  light.emissiveIntensity = 1.4;
  const floorMap = texture(512, 512, (c) => {
    c.fillStyle = "#64665f";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 15000; i++) {
      const x = (i * 73.31) % 512,
        y = (i * 137.47) % 512;
      c.fillStyle = i % 2 ? "#60625c" : "#696b63";
      c.fillRect(x, y, 2, 1);
    }
    c.strokeStyle = "#494b46";
    c.lineWidth = 3;
    c.strokeRect(0, 0, 512, 512);
  });
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(10, 14);
  const floorMat = mat("#ffffff", 0.86);
  floorMat.map = floorMap;
  const boxGeo = new THREE.BoxGeometry(1, 1, 1),
    cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const batches = new Map<
    string,
    {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      matrices: THREE.Matrix4[];
    }
  >();
  const dummy = new THREE.Object3D();
  function part(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rotation = 0,
    cylinder = false,
  ) {
    const geometry = cylinder ? cylGeo : boxGeo,
      key = material.uuid + geometry.uuid;
    let batch = batches.get(key);
    if (!batch) {
      batch = { geometry, material, matrices: [] };
      batches.set(key, batch);
    }
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    batch.matrices.push(dummy.matrix.clone());
  }
  function sign(
    text: string,
    sub: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotation = 0,
  ) {
    const t = texture(1024, 256, (c) => {
      c.fillStyle = "#15232a";
      c.fillRect(0, 0, 1024, 256);
      c.fillStyle = "#dbe7df";
      c.font = '600 92px "Noto Sans KR Variable"';
      c.textAlign = "center";
      c.fillText(text, 512, 119);
      c.fillStyle = "#9bbeb4";
      c.font = '28px "Noto Sans KR Variable"';
      c.fillText(sub, 512, 193);
    });
    const m = new THREE.MeshBasicMaterial({ map: t });
    materials.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.rotation.y = rotation;
    scene.add(p);
    return p;
  }
  part(floorMat, 0, -0.1, 0, ROOM.width, 0.2, ROOM.depth);
  part(wall, 0, 1.6, -7, 10, 3.2, 0.2);
  part(wall, 0, 1.6, 7, 10, 3.2, 0.2);
  for (const x of [-5, 5]) {
    part(wall, x, 1.6, 0, 0.2, 3.2, 14);
    part(graphite, x * 0.981, 0.55, 0, 0.04, 1.1, 14);
  }
  part(graphite, 0, 0.5, -6.87, 10, 1, 0.05);
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.12, 14),
    mat("#343b3d"),
  );
  ceiling.position.set(0, 3.24, 0);
  scene.add(ceiling);
  sign("온도 PC", "GOOD GAME. GOOD PLACE.", 3.1, 0.78, 0, 2.15, -6.85);
  sign("COUNTER", "카운터 · 이용 안내", 2.4, 0.6, 2.8, 2.3, 6.82, Math.PI);
  // Frosted entrance glazing and a modest city silhouette beyond it.
  part(dark, -0.3, 1.25, 6.85, 2.3, 2.5, 0.06);
  part(trim, -1.5, 1.25, 6.76, 0.06, 2.5, 0.08);
  part(trim, 0.9, 1.25, 6.76, 0.06, 2.5, 0.08);
  part(trim, -0.3, 2.5, 6.76, 2.46, 0.06, 0.08);
  part(trim, 0.5, 1.1, 6.65, 0.035, 0.38, 0.06);
  sign("어서 오세요", "온도 PC방", 1.5, 0.38, -0.3, 1.7, 6.73, Math.PI);
  for (const z of [-4.9, -1.7, 1.5, 4.7]) {
    for (const x of [-2.6, 2.6]) part(light, x, 3.1, z, 0.1, 0.04, 1.5);
    part(graphite, 0, 3.12, z, 10, 0.12, 0.07);
  }
  const screenMap = texture(768, 432, (c) => {
    const g = c.createLinearGradient(0, 0, 768, 432);
    g.addColorStop(0, "#16353e");
    g.addColorStop(1, "#0b151e");
    c.fillStyle = g;
    c.fillRect(0, 0, 768, 432);
    c.fillStyle = "#a1ccbe";
    c.font = '600 35px "Noto Sans KR Variable"';
    c.fillText("ONDO / PLAY", 42, 68);
    c.fillStyle = "#829fa5";
    c.font = '18px "Noto Sans KR Variable"';
    c.fillText("편안한 자리에서 시작하세요", 42, 102);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = ["#476575", "#6e6355", "#425d55", "#575d79"][i];
      c.fillRect(42 + i * 176, 140, 156, 192);
      c.fillStyle = "#cbd7d1";
      c.fillRect(56 + i * 176, 294, 92, 5);
    }
    c.fillStyle = "#78988e";
    c.fillRect(42, 375, 680, 2);
  });
  const screenMat = mat("#ffffff", 0.5);
  screenMat.map = screenMap;
  screenMat.emissive.set("#ffffff");
  screenMat.emissiveMap = screenMap;
  screenMat.emissiveIntensity = 0.55;
  const screens = new THREE.Group();
  scene.add(screens);
  const targets: THREE.Mesh[] = [];
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  materials.push(proxyMat);
  for (const seat of SEATS) {
    const p = (
      m: THREE.Material,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      cylinder = false,
    ) => {
      const v = localPoint(seat, x, z);
      part(m, v.x, y, v.z, w, h, d, seat.rotation, cylinder);
    };
    p(desk, 0, 0.745, 0, 1.38, 0.065, 0.76);
    p(edge, 0, 0.702, 0.35, 1.38, 0.025, 0.03);
    for (const x of [-0.62, 0.62]) {
      p(graphite, x, 0.35, -0.25, 0.055, 0.7, 0.055);
      p(graphite, x, 0.35, 0.26, 0.055, 0.7, 0.055);
    }
    p(graphite, -0.71, 0.99, -0.04, 0.035, 0.5, 0.8);
    p(edge, 0, 1.12, -0.16, 0.69, 0.41, 0.045);
    p(trim, 0, 0.87, -0.18, 0.035, 0.18, 0.035);
    p(edge, 0, 0.79, -0.12, 0.22, 0.015, 0.17);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.366),
      screenMat,
    );
    const pos = localPoint(seat, 0, -0.135);
    screen.position.set(pos.x, 1.12, pos.z);
    screen.rotation.y = seat.rotation;
    screens.add(screen);
    p(dark, -0.02, 0.784, 0.19, 0.62, 0.008, 0.26);
    p(edge, -0.1, 0.8, 0.18, 0.4, 0.018, 0.14);
    for (let row = 0; row < 4; row++)
      for (let key = 0; key < 12; key++)
        p(
          trim,
          -0.276 + key * 0.031,
          0.812,
          0.128 + row * 0.028,
          0.022,
          0.007,
          0.02,
        );
    p(graphite, 0.26, 0.802, 0.19, 0.055, 0.03, 0.085);
    p(edge, 0.52, 0.99, -0.03, 0.19, 0.42, 0.39);
    p(teal, 0.52, 1, 0.174, 0.045, 0.045, 0.009, true);
    p(fabric, 0, 0.49, 0.81, 0.53, 0.13, 0.5);
    p(fabric, 0, 0.91, 1.05, 0.51, 0.7, 0.12);
    p(edge, 0, 1.25, 1.06, 0.34, 0.17, 0.13);
    p(trim, 0, 0.25, 0.81, 0.045, 0.4, 0.045, true);
    p(edge, 0, 0.1, 0.81, 0.61, 0.05, 0.06);
    p(edge, 0, 0.1, 0.81, 0.06, 0.05, 0.61);
    for (const side of [-1, 1]) {
      p(edge, side * 0.29, 0.68, 0.83, 0.045, 0.05, 0.36);
      p(edge, side * 0.29, 0.58, 0.95, 0.035, 0.2, 0.035);
    }
    const labelPos = localPoint(seat, -0.48, 0.385);
    sign(
      seat.id,
      "STANDARD",
      0.16,
      0.065,
      labelPos.x,
      0.741,
      labelPos.z,
      seat.rotation,
    );
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 1.3, 1.4),
      proxyMat,
    );
    proxy.position.set(seat.x, 0.65, seat.z);
    proxy.userData = { kind: "seat", id: seat.id };
    targets.push(proxy);
  }
  part(desk, COUNTER.x, 0.52, COUNTER.z, COUNTER.width, 1.04, COUNTER.depth);
  part(
    edge,
    COUNTER.x,
    1.06,
    COUNTER.z,
    COUNTER.width + 0.12,
    0.065,
    COUNTER.depth + 0.08,
  );
  for (let i = 0; i < 24; i++)
    part(warm, 1.23 + i * 0.135, 0.51, 5.336, 0.045, 0.91, 0.025);
  part(teal, 2.8, 0.96, 5.325, 3.12, 0.022, 0.02);
  part(graphite, 2.5, 1.32, 5.77, 0.54, 0.34, 0.055);
  part(trim, 2.5, 1.14, 5.77, 0.045, 0.15, 0.07);
  part(cream, 4.2, 1.09, 5.55, 0.19, 0.12, 0.15);
  part(graphite, 4.17, 1.3, 5.57, 0.07, 0.33, 0.07);
  part(graphite, 3.3, 0.44, 6.65, 2.9, 0.88, 0.6);
  part(trim, 3.3, 0.9, 6.65, 2.98, 0.045, 0.65);
  part(cream, 4.2, 1.17, 6.62, 0.6, 0.48, 0.48);
  part(dark, 4.2, 1.2, 6.366, 0.47, 0.27, 0.01);
  part(desk, 2.95, 1.85, 6.65, 2.1, 0.04, 0.47);
  for (let i = 0; i < 9; i++)
    part(i % 2 ? warm : cream, 2.05 + i * 0.22, 1.98, 6.65, 0.16, 0.23, 0.13);
  sign("온도", "PC LOUNGE", 0.8, 0.2, 2.7, 0.66, 5.306);
  const cp = new THREE.Mesh(
    new THREE.BoxGeometry(COUNTER.width, 1.1, COUNTER.depth),
    proxyMat,
  );
  cp.position.set(COUNTER.x, 0.55, COUNTER.z);
  cp.userData = { kind: "counter" };
  targets.push(cp);
  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(
      batch.geometry,
      batch.material,
      batch.matrices.length,
    );
    batch.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  targets.forEach((t) => t.updateMatrixWorld(true));
  return { ceiling, targets, textures, materials };
}
