import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SEATS } from "../content/cafe";

/** Load once; one instanced draw per material for all twelve seats. */
export async function loadSeatAsset(scene: THREE.Scene) {
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/generated/seat-standard.glb`,
  );
  gltf.scene.updateMatrixWorld(true);
  const transform = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  gltf.scene.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, SEATS.length);
    mesh.name = `seats.${part.name}`;
    SEATS.forEach((seat, i) => {
      transform.position.set(seat.x, 0, seat.z);
      transform.rotation.set(0, seat.rotation, 0);
      transform.updateMatrix();
      matrix.multiplyMatrices(transform.matrix, part.matrixWorld);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  });
}
