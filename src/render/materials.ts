import * as THREE from "three";
export async function loadMaterials() {
  const textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();
  async function material(name: string, repeat: [number, number], tint: string, normalStrength: number) {
    const [map, normalMap, roughnessMap] = await Promise.all(["diff", "nor_gl", "rough"].map(async channel => {
      const t = await loader.loadAsync(`${import.meta.env.BASE_URL}assets/generated/materials/${name}_${channel}.jpg`);
      t.colorSpace = channel === "diff" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat); t.anisotropy = 4;
      textures.push(t); return t;
    }));
    return new THREE.MeshStandardMaterial({ name, color: tint, map, normalMap, roughnessMap,
      roughness: 1, normalScale: new THREE.Vector2(normalStrength, normalStrength) });
  }
  const [wood, plaster, concrete] = await Promise.all([
    material("wood", [1, 1], "#d8b795", .3),
    material("plaster", [3, 1], "#c6c5bf", .3),
    material("concrete", [4, 5.6], "#a4aaac", .4),
  ]);
  return { wood, plaster, concrete, dispose() {
    textures.forEach(t => t.dispose());
    [wood, plaster, concrete].forEach(m => m.dispose());
  } };
}
export type CafeMaterials = Awaited<ReturnType<typeof loadMaterials>>;
