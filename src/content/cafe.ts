export type Point = { x: number; z: number };
export type Seat = Point & { id: string; rotation: number };
export type Obstacle = Point & {
  width: number;
  depth: number;
  height: number;
  y: number;
};
export const ROOM = { width: 10, depth: 14, height: 3.2 };
export const SPAWN = { x: 0, z: 5.9, yaw: 0 };
export const SEATS: readonly Seat[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1).padStart(2, "0"),
  x: i < 6 ? -3.9 : 3.9,
  z: -5.15 + (i % 6) * 1.55,
  rotation: i < 6 ? Math.PI / 2 : -Math.PI / 2,
}));
export const COUNTER = {
  x: 2.8,
  z: 5.75,
  width: 3.3,
  depth: 0.8,
  height: 1.05,
  y: 0.525,
};
export function localPoint(seat: Seat, x: number, z: number): Point {
  return {
    x: seat.x + Math.cos(seat.rotation) * x + Math.sin(seat.rotation) * z,
    z: seat.z - Math.sin(seat.rotation) * x + Math.cos(seat.rotation) * z,
  };
}
export const ROOM_OBSTACLES: readonly Obstacle[] = [
  { x: 0, z: -7, width: 10.4, depth: 0.2, height: 3.2, y: 1.6 },
  { x: 0, z: 7, width: 10.4, depth: 0.2, height: 3.2, y: 1.6 },
  ...[-5, 5].map((x) => ({
    x,
    z: 0,
    width: 0.2,
    depth: 14,
    height: 3.2,
    y: 1.6,
  })),
];
export function furnitureObstacles(ids: readonly string[], counter: boolean): Obstacle[] {
  return [
  ...(counter ? [COUNTER, { x: 3.3, z: 6.65, width: 2.9, depth: 0.6, height: 2, y: 1 }] : []),
  ...SEATS.filter(s => ids.includes(s.id)).flatMap((seat) => [
    { x: seat.x, z: seat.z, width: 0.76, depth: 1.4, height: 1.3, y: 0.65 },
    {
      ...localPoint(seat, 0, 0.8),
      width: 0.65,
      depth: 0.65,
      height: 1.2,
      y: 0.6,
    },
  ]),
  ];
}
export const OBSTACLES = [...ROOM_OBSTACLES, ...furnitureObstacles(SEATS.map(s => s.id), true)];
