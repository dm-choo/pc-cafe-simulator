import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { loadMaterials } from "../render/materials";
import { SEATS, SPAWN, furnitureObstacles } from "../content/cafe";
import type { ShopItem } from "../content/shop";
import {
  createGame,
  command,
  step,
  type Command,
  type GameState,
} from "../sim/game";
import { createCustomerView } from "../render/customers";
import { loadSeatAsset } from "../render/seat-asset";
import { buildCafe } from "../render/cafe";
import { FixedClock } from "./clock";
import { createPhysics } from "./physics";
export type Mode =
  | "welcome"
  | "play"
  | "pause"
  | "counter"
  | "shop"
  | "layout"
  | "settings"
  | "seat"
  | "error";
export type Snapshot = Readonly<{
  mode: Mode;
  game: GameState;
  speed: 1 | 4;
  tick: number;
  target: string | null;
  selectedSeat: string | null;
  locked: boolean;
  quality: "standard" | "low";
  sensitivity: number;
  message: string;
  preview: string;
  debug: boolean;
  calls: number;
  triangles: number;
  lag: number;
}>;
export async function createEngine(canvas: HTMLCanvasElement) {
  await document.fonts.load(
    '600 20px "Noto Sans KR Variable"',
    "온도 카운터 이용 안내 어서 오세요 PC방 편안한 자리에서 시작하세요",
  );
  const physics = await createPhysics();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor("#171f25");
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#303d41", 12, 29);
  const surfaces = await loadMaterials();
  const cafe = buildCafe(scene, surfaces);
  const seatView = await loadSeatAsset(scene, surfaces);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentRoom = new RoomEnvironment();
  const environment = pmrem.fromScene(environmentRoom, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.45;
  environmentRoom.dispose(); pmrem.dispose();
  const customerView = createCustomerView(scene);
  scene.add(new THREE.HemisphereLight("#dbe9f1", "#585552", 0.85));
  const keyLight = new THREE.DirectionalLight("#ffedd4", 1.8);
  keyLight.position.set(-2, 3.08, 1);
  keyLight.castShadow = true;
  // Refresh only after installation or while customers animate.
  keyLight.shadow.autoUpdate = false;
  keyLight.shadow.needsUpdate = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.normalBias = 0.025;
  scene.add(keyLight);
  const fill = new THREE.PointLight("#98cbd2", 13, 12, 2);
  fill.position.set(0, 2.6, -4);
  scene.add(fill);
  const counterLight = new THREE.PointLight("#ffd2a2", 9, 7, 2);
  counterLight.position.set(2.5, 2.6, 5);
  scene.add(counterLight);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 45);
  camera.rotation.order = "YXZ";
  const overhead = new THREE.OrthographicCamera(-7, 7, 9, -9, 0.1, 45);
  overhead.position.set(0, 20, 0);
  overhead.up.set(0, 0, -1);
  overhead.lookAt(0, 0, 0);
  const ring = new THREE.Mesh(
    new THREE.BoxGeometry(0.83, 0.02, 1.43),
    new THREE.MeshBasicMaterial({
      color: "#c3ead7",
      transparent: true,
      opacity: 0.65,
    }),
  );
  ring.visible = false;
  ring.position.y = 0.015;
  scene.add(ring);
  const ghostMaterial = new THREE.MeshBasicMaterial({
    color: "#a1d3b3",
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const ghost = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.78, 1.4),
    ghostMaterial,
  );
  ghost.visible = false;
  scene.add(ghost);
  const ray = new THREE.Raycaster(),
    mouse = new THREE.Vector2();
  const listeners = new Set<() => void>(),
    keys = new Set<string>(),
    events = new AbortController(),
    clock = new FixedClock(),
    playerClock = new FixedClock();
  let game = createGame(),
    yaw = SPAWN.yaw,
    pitch = -0.025,
    previous = 0,
    lastUI = 0,
    dragging = false,
    running = true,
    renderDirty = true,
    hadCustomers = false;
  let target: THREE.Mesh | undefined,
    settingsReturn: Mode = "pause";
  let snapshot: Snapshot = {
    mode: "welcome",
    game,
    speed: 1,
    tick: 0,
    target: null,
    selectedSeat: null,
    locked: false,
    quality: "standard",
    sensitivity: 1,
    message: "",
    preview: "",
    debug: new URLSearchParams(location.search).has("debug"),
    calls: 0,
    triangles: 0,
    lag: 0,
  };
  const publish = (change: Partial<Snapshot> = {}) => {
    snapshot = {
      ...snapshot,
      ...change,
      tick: game.tick,
      game,
      selectedSeat: game.selectedSeat,
    };
    listeners.forEach((fn) => fn());
  };
  const send = (action: Command) => {
    const before = game;
    game = command(game, action);
    renderDirty = true;
    if (before.seats !== game.seats || before.counter !== game.counter) {
      const ids = Object.keys(game.seats);
      // Only rebuild colliders/render instances when the installation set changes.
      if (before.counter !== game.counter || ids.join() !== Object.keys(before.seats).join()) {
        seatView.sync(ids);
        cafe.sync(ids, game.counter);
        physics.syncFurniture(ids, game.counter);
        keyLight.shadow.needsUpdate = true;
      }
    }
    publish();
  };
  const blocked = () => snapshot.mode !== "play" || document.hidden;
  const setMode = (mode: Mode) => {
    renderDirty = true;
    keys.clear();
    dragging = false;
    clock.reset();
    playerClock.reset();
    cafe.ceiling.visible = mode !== "layout";
    cafe.plots.visible = mode === "layout";
    ghost.visible = false;
    ring.visible = false;
    publish({ mode, target: null, preview: "", message: "" });
    if (mode !== "play" && document.pointerLockElement === canvas)
      document.exitPointerLock();
  };
  const start = (lock = true) => {
    setMode("play");
    if (lock && !document.pointerLockElement) {
      try {
        const promise = canvas.requestPointerLock();
        promise?.catch(() =>
          publish({
            message:
              "마우스 잠금을 사용할 수 없습니다. 화면을 드래그하거나 방향키로 둘러보세요.",
          }),
        );
      } catch {
        publish({ message: "화면을 드래그하거나 방향키로 둘러보세요." });
      }
    }
  };
  function resize() {
    renderDirty = true;
    const w = innerWidth,
      h = innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, snapshot.quality === "low" ? 0.75 : 1.5),
    );
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const span = Math.max(8.1, 5.8 / (w / h));
    overhead.left = (-span * w) / h;
    overhead.right = (span * w) / h;
    overhead.top = span;
    overhead.bottom = -span;
    overhead.updateProjectionMatrix();
  }
  function interact() {
    if (snapshot.mode !== "play" || !target) return;
    if (target.userData.kind === "counter") setMode("counter");
    else {
      send({ type: "select-seat", seatId: target.userData.id });
      setMode("seat");
    }
  }
  function locate(event: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    mouse.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    // DOM controls can become available before the first overhead render.
    overhead.updateMatrixWorld(true);
    ray.setFromCamera(mouse, overhead);
  }
  window.addEventListener("resize", resize, { signal: events.signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      clock.reset();
      playerClock.reset();
      keys.clear();
      if (document.hidden && snapshot.mode === "play") setMode("pause");
    },
    { signal: events.signal },
  );
  window.addEventListener(
    "blur",
    () => {
      if (snapshot.mode === "play") setMode("pause");
      keys.clear();
    },
    { signal: events.signal },
  );
  document.addEventListener(
    "pointerlockchange",
    () => {
      const locked = document.pointerLockElement === canvas;
      publish({ locked });
      if (!locked && snapshot.mode === "play") setMode("pause");
    },
    { signal: events.signal },
  );
  document.addEventListener(
    "pointerlockerror",
    () => publish({ message: "화면 드래그 또는 방향키로 둘러볼 수 있습니다." }),
    { signal: events.signal },
  );
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "Escape") {
        if (snapshot.mode === "play") setMode("pause");
        else if (snapshot.mode === "settings") setMode(settingsReturn);
        else if (!["welcome", "error"].includes(snapshot.mode))
          setMode("pause");
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
        ].includes(e.code)
      ) {
        if (snapshot.mode === "play") {
          e.preventDefault();
          keys.add(e.code);
        }
      }
      if (e.repeat) return;
      if (snapshot.mode === "play" && ["Digit1", "Digit4"].includes(e.code)) {
        publish({ speed: e.code === "Digit1" ? 1 : 4 });
        clock.reset();
      }
      if (e.code === "KeyE") interact();
      if (e.code === "KeyB" && snapshot.mode === "play") setMode("layout");
      if (e.code === "KeyN" && snapshot.mode === "play") setMode("shop");
      if (e.code === "KeyP" && snapshot.mode === "play") setMode("pause");
      if (snapshot.debug && e.code === "F3") {
        e.preventDefault();
        reset();
      }
    },
    { signal: events.signal },
  );
  window.addEventListener("keyup", (e) => keys.delete(e.code), {
    signal: events.signal,
  });
  canvas.addEventListener(
    "mousedown",
    (e) => {
      if (e.button !== 0) return;
      if (snapshot.mode === "play" && !document.pointerLockElement)
        dragging = true;
      if (snapshot.mode === "layout") {
        locate(e);
        const item = ray
          .intersectObjects(cafe.targets)
          .find((h) => h.object.userData.kind === "seat");
        if (item) {
          send({ type: "select-seat", seatId: item.object.userData.id });
          publish({ preview: "선택한 구역에 좌석을 설치할 수 있습니다" });
        }
      }
    },
    { signal: events.signal },
  );
  window.addEventListener("mouseup", () => (dragging = false), {
    signal: events.signal,
  });
  window.addEventListener(
    "mousemove",
    (e) => {
      if (snapshot.mode === "layout") {
        return;
      }
      if (
        snapshot.mode !== "play" ||
        (!document.pointerLockElement && !dragging)
      )
        return;
      yaw -= e.movementX * 0.002 * snapshot.sensitivity;
      pitch = THREE.MathUtils.clamp(
        pitch - e.movementY * 0.002 * snapshot.sensitivity,
        -1.35,
        1.35,
      );
    },
    { signal: events.signal },
  );
  canvas.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      setMode("error");
      publish({
        message:
          "그래픽 연결이 끊겼습니다. 복구를 기다리거나 새로고침해 주세요.",
      });
    },
    { signal: events.signal },
  );
  canvas.addEventListener(
    "webglcontextrestored",
    () => {
      keyLight.shadow.needsUpdate = true;
      setMode("pause");
    },
    {
      signal: events.signal,
    },
  );
  function reset() {
    customerView.clear();
    keyLight.shadow.needsUpdate = true;
    physics.reset();
    yaw = SPAWN.yaw;
    pitch = -0.025;
    send({ type: "reset" });
    clock.reset();
    playerClock.reset();
    setMode("pause");
  }
  function frame(now: number) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(Math.max((now - previous) / 1000, 0), 0.05);
    previous = now;
    const lag = clock.advance(
      now,
      blocked(),
      () => {
        game = step(game);
      },
      snapshot.speed,
    );
    playerClock.advance(now, blocked(), () => {
      yaw +=
        (Number(keys.has("ArrowLeft")) - Number(keys.has("ArrowRight"))) *
        0.05 *
        1.4;
      pitch = THREE.MathUtils.clamp(
        pitch +
          (Number(keys.has("ArrowUp")) - Number(keys.has("ArrowDown"))) * 0.05,
        -1.35,
        1.35,
      );
      const forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
      const side = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
      const distance = (2.2 * 0.05) / (Math.hypot(forward, side) || 1);
      physics.move(
        (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * distance,
        (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * distance,
      );
    });
    if (document.hidden || snapshot.mode === "error") return;
    // Menus pause the world. Redraw only for mode/placement/quality/resize changes;
    // keep the clocks above running so blocked wall time is never replayed.
    if (blocked() && !renderDirty) return;
    const pos = physics.position();
    const blend = snapshot.mode === "play" ? 1 - Math.exp(-30 * dt) : 1;
    camera.position.x += (pos.x - camera.position.x) * blend;
    camera.position.z += (pos.z - camera.position.z) * blend;
    camera.position.y = 1.65;
    camera.rotation.set(pitch, yaw, 0);
    camera.updateMatrixWorld();
    if (snapshot.mode === "play") {
      ray.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersection = ray.intersectObjects(cafe.targets.filter(t =>
        t.userData.kind === "counter" ? game.counter : t.userData.id in game.seats))[0];
      target =
        intersection && intersection.distance <= 2.35
          ? (intersection.object as THREE.Mesh)
          : undefined;
      const name = target
        ? target.userData.kind === "counter"
          ? "카운터"
          : `${target.userData.id}번 좌석`
        : null;
      if (name !== snapshot.target) publish({ target: name });
      ring.visible = !!target && target.userData.kind === "seat";
      if (ring.visible)
        ring.position.set(target!.position.x, 0.015, target!.position.z);
    }
    if (snapshot.mode === "layout") {
      const selected = SEATS.find((s) => s.id === game.selectedSeat);
      ring.visible = !!selected;
      if (selected) ring.position.set(selected.x, 1.4, selected.z);
      ghost.visible = !!selected && !(selected.id in game.seats);
      if (selected) ghost.position.set(selected.x, 0.4, selected.z);
    }
    customerView.update(game, dt);
    if (game.customers.length || hadCustomers)
      keyLight.shadow.needsUpdate = true;
    hadCustomers = game.customers.length > 0;
    renderer.render(scene, snapshot.mode === "layout" ? overhead : camera);
    renderDirty = false;
    if (now - lastUI > 250 || blocked()) {
      lastUI = now;
      publish({
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        lag,
      });
    }
  }
  camera.position.set(SPAWN.x, 1.65, SPAWN.z);
  resize();
  requestAnimationFrame(frame);
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => snapshot,
    openCafe: () => {
      send({ type: "open" });
      start(false);
    },
    closeCafe: () => {
      send({ type: "close" });
      start(false);
    },
    speed: (speed: 1 | 4) => {
      publish({ speed });
      clock.reset();
    },
    start,
    interact,
    pause: () => setMode("pause"),
    layout: () => setMode("layout"),
    shop: () => setMode("shop"),
    buy: (item: ShopItem) => send({ type: "buy", item }),
    install: (item: ShopItem) => {
      const id = game.selectedSeat;
      if (item === "seat" && !id) return;
      const pos = physics.position();
      const overlaps = furnitureObstacles(item === "seat" ? [id!] : [], item === "counter").some(o =>
        Math.abs(pos.x - o.x) < o.width / 2 + 0.32 && Math.abs(pos.z - o.z) < o.depth / 2 + 0.32);
      if (overlaps) { publish({ message: "설치할 위치에서 사장님이 먼저 비켜 주세요" }); return; }
      publish({ message: "" });
      send(item === "counter" ? { type: "install-counter" } : { type: "install-seat", seatId: id! });
    },
    settings: () => {
      settingsReturn = snapshot.mode === "welcome" ? "welcome" : "pause";
      setMode("settings");
    },
    closeSettings: () => setMode(settingsReturn),
    selectSeat: (id: string) => send({ type: "select-seat", seatId: id }),
    quality(value: "standard" | "low") {
      publish({ quality: value });
      renderer.shadowMap.enabled = value === "standard";
      keyLight.shadow.needsUpdate = true;
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => (m.needsUpdate = true));
        }
      });
      resize();
    },
    sensitivity(value: number) {
      publish({ sensitivity: value });
    },
    reset,
    diagnostics: () => ({
      game,
      speed: snapshot.speed,
      tick: game.tick,
      position: { ...physics.position() },
      yaw,
      mode: snapshot.mode,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      renderer: renderer
        .getContext()
        .getParameter(renderer.getContext().RENDERER),
      size: [canvas.width, canvas.height],
    }),
    dispose() {
      running = false;
      customerView.dispose();
      events.abort();
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
          if (o instanceof THREE.InstancedMesh) o.dispose();
        }
      });
      cafe.targets.forEach((t) => geometries.add(t.geometry));
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      cafe.materials.forEach((m) => m.dispose());
      cafe.textures.forEach((t) => t.dispose());
      cafe.disposePlots();
      surfaces.dispose();
      environment.dispose();
      keyLight.shadow.dispose();
      renderer.dispose();
      physics.dispose();
      listeners.clear();
    },
  };
}
export type Engine = Awaited<ReturnType<typeof createEngine>>;
