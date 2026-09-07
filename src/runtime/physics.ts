import RAPIER from "@dimforge/rapier3d-compat";
import { ROOM_OBSTACLES, SPAWN, furnitureObstacles, type Obstacle } from "../content/cafe";
export async function createPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  const add = (o: Obstacle) => world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        o.width / 2,
        o.height / 2,
        o.depth / 2,
      ).setTranslation(o.x, o.y, o.z),
    );
  for (const o of ROOM_OBSTACLES) add(o);
  let furniture: RAPIER.Collider[] = [];
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      SPAWN.x,
      0.85,
      SPAWN.z,
    ),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(0.55, 0.27),
    body,
  );
  const controller = world.createCharacterController(0.02);
  controller.setSlideEnabled(true);
  world.step();
  return {
    syncFurniture(ids: readonly string[], counter: boolean) {
      furniture.forEach(c => world.removeCollider(c, true));
      furniture = furnitureObstacles(ids, counter).map(add);
      world.step();
    },
    position: () => body.translation(),
    move(x: number, z: number) {
      controller.computeColliderMovement(collider, { x, y: 0, z });
      const m = controller.computedMovement(),
        p = body.translation();
      body.setNextKinematicTranslation({ x: p.x + m.x, y: 0.85, z: p.z + m.z });
      world.step();
    },
    reset() {
      body.setTranslation({ x: SPAWN.x, y: 0.85, z: SPAWN.z }, true);
      world.step();
    },
    dispose() {
      world.free();
    },
  };
}
