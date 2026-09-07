import * as THREE from "three";
import { SEATS } from "../content/cafe";
import type { GameState } from "../sim/game";
export function createCustomerView(scene: THREE.Scene) {
  const people = new Map<
    number,
    {
      root: THREE.Group;
      legs: THREE.Mesh[];
      arms: THREE.Mesh[];
      head: THREE.Mesh;
      body: THREE.Mesh;
      last: THREE.Vector3;
    }
  >();
  const skin = new THREE.MeshStandardMaterial({
    color: "#bd967b",
    roughness: 0.9,
  });
  const shirt = new THREE.MeshStandardMaterial({
    color: "#587889",
    roughness: 0.9,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: "#273038",
    roughness: 0.85,
  });
  const hair = new THREE.MeshStandardMaterial({
    color: "#27211f",
    roughness: 1,
  });
  const sphere = new THREE.SphereGeometry(0.13, 12, 8),
    torso = new THREE.BoxGeometry(0.37, 0.52, 0.21),
    limb = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 8);
  function create(id: number) {
    const root = new THREE.Group();
    const body = new THREE.Mesh(torso, shirt);
    body.position.y = 1.06;
    root.add(body);
    const head = new THREE.Mesh(sphere, skin);
    head.position.y = 1.48;
    root.add(head);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.133, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      hair,
    );
    cap.position.y = 0.02;
    head.add(cap);
    const legs = [-1, 1].map((side) => {
      const leg = new THREE.Mesh(limb, pants);
      leg.position.set(side * 0.1, 0.5, 0);
      root.add(leg);
      return leg;
    });
    const arms = [-1, 1].map((side) => {
      const arm = new THREE.Mesh(limb, shirt);
      arm.scale.set(0.75, 0.9, 0.75);
      arm.position.set(side * 0.235, 0.97, 0);
      root.add(arm);
      return arm;
    });
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(root);
    const value = { root, body, head, legs, arms, last: new THREE.Vector3() };
    people.set(id, value);
    return value;
  }
  return {
    update(state: GameState, dt: number) {
      for (const [id, v] of people)
        if (!state.customers.some((c) => c.id === id)) {
          scene.remove(v.root);
          v.head.children.forEach((o) => {
            if (o instanceof THREE.Mesh) o.geometry.dispose();
          });
          people.delete(id);
        }
      for (const c of state.customers) {
        const fresh = !people.has(c.id),
          v = people.get(c.id) ?? create(c.id);
        const dest = new THREE.Vector3(c.position.x, 0, c.position.z);
        if (fresh) {
          v.root.position.copy(dest);
          v.last.copy(dest);
        }
        const seated = c.phase === "using";
        const blend = 1 - Math.exp(-14 * dt);
        v.root.position.lerp(dest, blend);
        const direction = dest.clone().sub(v.last);
        if (seated)
          v.root.rotation.y =
            SEATS.find((s) => s.id === c.seatId)!.rotation + Math.PI;
        else if (direction.lengthSq() > 0.00001)
          v.root.rotation.y = Math.atan2(direction.x, direction.z);
        v.last.copy(dest);
        const swing = Math.sin(state.tick * 0.05 * 8 + c.id) * 0.42;
        v.body.position.y = seated ? 0.86 : 1.06;
        v.head.position.y = seated ? 1.25 : 1.48;
        v.legs.forEach((leg, i) => {
          leg.position.y = seated ? 0.28 : 0.5;
          leg.position.z = seated ? 0.26 : 0;
          leg.rotation.x = seated ? 0 : (i ? 1 : -1) * swing;
        });
        v.arms.forEach((arm, i) => {
          arm.position.y = seated ? 0.84 : 0.97;
          arm.position.z = seated ? 0.18 : 0;
          arm.rotation.x = seated ? -0.9 : (i ? -1 : 1) * swing * 0.5;
        });
      }
    },
    clear() {
      for (const v of people.values()) {
        scene.remove(v.root);
        v.head.children.forEach((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
      }
      people.clear();
    },
    dispose() {
      this.clear();
      [sphere, torso, limb].forEach((g) => g.dispose());
      [skin, shirt, pants, hair].forEach((m) => m.dispose());
    },
  };
}
