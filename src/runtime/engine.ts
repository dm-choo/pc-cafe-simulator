import * as THREE from 'three';
import { SEATS, SPAWN } from '../content/cafe';
import { createGame, command, step, type Command } from '../sim/game';
import { buildCafe } from '../render/cafe';
import { placementReason } from '../sim/layout';
import { FixedClock } from './clock';
import { createPhysics } from './physics';
export type Mode = 'welcome' | 'play' | 'pause' | 'counter' | 'layout' | 'settings' | 'seat' | 'error';
export type Snapshot = Readonly<{
  mode: Mode; tick: number; target: string | null; selectedSeat: string | null;
  locked: boolean; quality: 'standard' | 'low'; sensitivity: number; message: string;
  preview: string; debug: boolean; calls: number; triangles: number; lag: number;
}>;
export async function createEngine(canvas: HTMLCanvasElement) {
  await document.fonts.load('600 20px "Noto Sans KR Variable"', '온도 카운터 이용 안내 어서 오세요 PC방 편안한 자리에서 시작하세요');
  const physics = await createPhysics();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor('#171f25'); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#303d41', 12, 29);
  const cafe = buildCafe(scene);
  scene.add(new THREE.HemisphereLight('#dbe9f1', '#787167', 2.1));
  const keyLight = new THREE.DirectionalLight('#ffedd4', 3.1); keyLight.position.set(-2, 6, 4); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -8; keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 10; keyLight.shadow.camera.bottom = -10; keyLight.shadow.normalBias = 0.025; scene.add(keyLight);
  const fill = new THREE.PointLight('#98cbd2', 13, 12, 2); fill.position.set(0, 2.6, -4); scene.add(fill);
  const counterLight = new THREE.PointLight('#ffd2a2', 9, 7, 2); counterLight.position.set(2.5, 2.6, 5); scene.add(counterLight);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 45); camera.rotation.order = 'YXZ';
  const overhead = new THREE.OrthographicCamera(-7, 7, 9, -9, 0.1, 45); overhead.position.set(0, 20, 0); overhead.up.set(0, 0, -1); overhead.lookAt(0, 0, 0);
  const ring = new THREE.Mesh(new THREE.BoxGeometry(0.83, 0.02, 1.43), new THREE.MeshBasicMaterial({ color: '#c3ead7', transparent: true, opacity: 0.65 })); ring.visible = false; ring.position.y = 0.015; scene.add(ring);
  const ghostMaterial = new THREE.MeshBasicMaterial({ color: '#a1d3b3', transparent: true, opacity: 0.38, depthWrite: false });
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.78, 1.4), ghostMaterial); ghost.visible = false; scene.add(ghost);
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  const listeners = new Set<() => void>(), keys = new Set<string>(), events = new AbortController(), clock = new FixedClock();
  let game = createGame(), yaw = SPAWN.yaw, pitch = -0.025, previous = 0, lastUI = 0, dragging = false, running = true;
  let target: THREE.Mesh | undefined, settingsReturn: Mode = 'pause';
  let snapshot: Snapshot = { mode: 'welcome', tick: 0, target: null, selectedSeat: null, locked: false, quality: 'standard', sensitivity: 1, message: '', preview: '', debug: new URLSearchParams(location.search).has('debug'), calls: 0, triangles: 0, lag: 0 };
  const publish = (change: Partial<Snapshot> = {}) => {
    snapshot = { ...snapshot, ...change, tick: game.tick, selectedSeat: game.selectedSeat }; listeners.forEach(fn => fn());
  };
  const send = (action: Command) => { game = command(game, action); publish(); };
  const blocked = () => snapshot.mode !== 'play' || document.hidden;
  const setMode = (mode: Mode) => {
    keys.clear(); dragging = false; clock.reset();
    cafe.ceiling.visible = mode !== 'layout'; ghost.visible = false; ring.visible = false;
    publish({ mode, target: null, preview: '', message: '' });
    if (mode !== 'play' && document.pointerLockElement === canvas) document.exitPointerLock();
  };
  const start = (lock = true) => {
    setMode('play');
    if (lock && !document.pointerLockElement) {
      try { const promise = canvas.requestPointerLock(); promise?.catch(() => publish({ message: '마우스 잠금을 사용할 수 없습니다. 화면을 드래그하거나 방향키로 둘러보세요.' })); }
      catch { publish({ message: '화면을 드래그하거나 방향키로 둘러보세요.' }); }
    }
  };
  function resize() {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h); renderer.setPixelRatio(Math.min(devicePixelRatio, snapshot.quality === 'low' ? 1 : 1.5));
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const span = Math.max(8.1, 5.8 / (w / h)); overhead.left = -span * w / h; overhead.right = span * w / h; overhead.top = span; overhead.bottom = -span; overhead.updateProjectionMatrix();
  }
  function interact() {
    if (snapshot.mode !== 'play' || !target) return;
    if (target.userData.kind === 'counter') setMode('counter');
    else { send({ type: 'select-seat', seatId: target.userData.id }); setMode('seat'); }
  }
  function locate(event: MouseEvent) {
    const r = canvas.getBoundingClientRect(); mouse.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(mouse, overhead);
  }
  function layoutHover(event: MouseEvent) {
    locate(event);
    const seat = SEATS.find(s => s.id === game.selectedSeat);
    if (!seat || !ray.ray.intersectPlane(floorPlane, hit)) return;
    const x = Math.round(hit.x * 4) / 4, z = Math.round(hit.z * 4) / 4;
    ghost.position.set(x, 0.4, z); ghost.visible = true;
    const reason = placementReason(seat, x, z); ghostMaterial.color.set(reason ? '#e88e78' : '#a1d3b3');
    publish({ preview: reason ?? '배치 가능 · 미리보기만 표시됩니다' });
  }
  window.addEventListener('resize', resize, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { clock.reset(); keys.clear(); if (document.hidden && snapshot.mode === 'play') setMode('pause'); }, { signal: events.signal });
  window.addEventListener('blur', () => { if (snapshot.mode === 'play') setMode('pause'); keys.clear(); }, { signal: events.signal });
  document.addEventListener('pointerlockchange', () => { const locked = document.pointerLockElement === canvas; publish({ locked }); if (!locked && snapshot.mode === 'play') setMode('pause'); }, { signal: events.signal });
  document.addEventListener('pointerlockerror', () => publish({ message: '화면 드래그 또는 방향키로 둘러볼 수 있습니다.' }), { signal: events.signal });
  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) { if (snapshot.mode === 'play') { e.preventDefault(); keys.add(e.code); } }
    if (e.repeat) return;
    if (e.code === 'Escape') { if (snapshot.mode === 'play') setMode('pause'); else if (snapshot.mode === 'settings') setMode(settingsReturn); else if (!['welcome', 'error'].includes(snapshot.mode)) setMode('pause'); }
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyB' && snapshot.mode === 'play') setMode('layout');
    if (e.code === 'KeyP' && snapshot.mode === 'play') setMode('pause');
    if (snapshot.debug && e.code === 'F3') { e.preventDefault(); reset(); }
  }, { signal: events.signal });
  window.addEventListener('keyup', e => keys.delete(e.code), { signal: events.signal });
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (snapshot.mode === 'play' && !document.pointerLockElement) dragging = true;
    if (snapshot.mode === 'layout') {
      locate(e); const item = ray.intersectObjects(cafe.targets).find(h => h.object.userData.kind === 'seat');
      if (item) { send({ type: 'select-seat', seatId: item.object.userData.id }); publish({ preview: '마우스를 움직여 위치를 미리 보세요' }); }
    }
  }, { signal: events.signal });
  window.addEventListener('mouseup', () => dragging = false, { signal: events.signal });
  window.addEventListener('mousemove', e => {
    if (snapshot.mode === 'layout') { layoutHover(e); return; }
    if (snapshot.mode !== 'play' || (!document.pointerLockElement && !dragging)) return;
    yaw -= e.movementX * 0.002 * snapshot.sensitivity; pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.002 * snapshot.sensitivity, -1.35, 1.35);
  }, { signal: events.signal });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); setMode('error'); publish({ message: '그래픽 연결이 끊겼습니다. 복구를 기다리거나 새로고침해 주세요.' }); }, { signal: events.signal });
  canvas.addEventListener('webglcontextrestored', () => setMode('pause'), { signal: events.signal });
  function reset() { physics.reset(); yaw = SPAWN.yaw; pitch = -0.025; send({ type: 'reset' }); clock.reset(); setMode('pause'); }
  function frame(now: number) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(Math.max((now - previous) / 1000, 0), 0.05); previous = now;
    const lag = clock.advance(now, blocked(), () => { game = step(game); });
    if (document.hidden || snapshot.mode === 'error') return;
    if (snapshot.mode === 'play') {
      yaw += ((keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)) * dt * 1.4;
      pitch = THREE.MathUtils.clamp(pitch + ((keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0)) * dt, -1.35, 1.35);
      const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS')), side = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
      const length = Math.hypot(forward, side) || 1, distance = 2.2 * dt / length;
      physics.move((-Math.sin(yaw) * forward + Math.cos(yaw) * side) * distance, (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * distance);
    }
    const pos = physics.position(); camera.position.set(pos.x, 1.65, pos.z); camera.rotation.set(pitch, yaw, 0);
    camera.updateMatrixWorld();
    if (snapshot.mode === 'play') {
      ray.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersection = ray.intersectObjects(cafe.targets)[0]; target = intersection && intersection.distance <= 2.35 ? intersection.object as THREE.Mesh : undefined;
      const name = target ? target.userData.kind === 'counter' ? '카운터' : `${target.userData.id}번 좌석` : null;
      if (name !== snapshot.target) publish({ target: name });
      ring.visible = !!target && target.userData.kind === 'seat'; if (ring.visible) ring.position.set(target!.position.x, 0.015, target!.position.z);
    }
    renderer.render(scene, snapshot.mode === 'layout' ? overhead : camera);
    if (now - lastUI > 250) { lastUI = now; publish({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, lag }); }
  }
  resize(); requestAnimationFrame(frame);
  return {
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    getSnapshot: () => snapshot, start, interact,
    pause: () => setMode('pause'), layout: () => setMode('layout'),
    settings: () => { settingsReturn = snapshot.mode === 'welcome' ? 'welcome' : 'pause'; setMode('settings'); },
    closeSettings: () => setMode(settingsReturn),
    selectSeat: (id: string) => send({ type: 'select-seat', seatId: id }),
    quality(value: 'standard' | 'low') { publish({ quality: value }); renderer.shadowMap.enabled = value === 'standard'; scene.traverse(o => { if (o instanceof THREE.Mesh) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => m.needsUpdate = true); } }); resize(); },
    sensitivity(value: number) { publish({ sensitivity: value }); }, reset,
    diagnostics: () => ({ tick: game.tick, position: { ...physics.position() }, yaw, mode: snapshot.mode, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, renderer: renderer.getContext().getParameter(renderer.getContext().RENDERER), size: [canvas.width, canvas.height] }),
    dispose() {
      running = false; events.abort(); if (document.pointerLockElement === canvas) document.exitPointerLock();
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(o => { if (o instanceof THREE.Mesh) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); if (o instanceof THREE.InstancedMesh) o.dispose(); } });
      cafe.targets.forEach(t => geometries.add(t.geometry)); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); cafe.materials.forEach(m => m.dispose()); cafe.textures.forEach(t => t.dispose());
      keyLight.shadow.dispose(); renderer.dispose(); physics.dispose(); listeners.clear();
    },
  };
}
export type Engine = Awaited<ReturnType<typeof createEngine>>;
