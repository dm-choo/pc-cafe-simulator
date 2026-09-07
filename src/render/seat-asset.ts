import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SEATS } from "../content/cafe";
import type { CafeMaterials } from "./materials";

/** Load once; one instanced draw per material for all twelve seats. */
export async function loadSeatAsset(scene: THREE.Scene, surfaces: CafeMaterials) {
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/generated/seat-standard.glb`,
  );
  gltf.scene.updateMatrixWorld(true);
  const transform = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  const batches: { mesh: THREE.InstancedMesh; local: THREE.Matrix4 }[] = [];
  gltf.scene.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    if (part.name === "walnut") {
      (part.material as THREE.Material).dispose();
      part.material = surfaces.wood;
    }
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, SEATS.length);
    mesh.name = `seats.${part.name}`;
    batches.push({ mesh, local: part.matrixWorld.clone() });
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
  return {
    sync(ids: readonly string[]) {
      for (const { mesh, local } of batches) {
      const installed = SEATS.filter(s => ids.includes(s.id));
      installed.forEach((seat, i) => {
      transform.position.set(seat.x, 0, seat.z);
      transform.rotation.set(0, seat.rotation, 0);
      transform.updateMatrix();
      matrix.multiplyMatrices(transform.matrix, local);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.count = installed.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
      }
    },
  };
}
