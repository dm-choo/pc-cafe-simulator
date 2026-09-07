import { expect, it } from "vitest";
import { createGame, command, step, type GameState } from "../../src/sim/game";
import { CATALOG, STARTING_CASH } from "../../src/content/shop";
import { createPhysics } from "../../src/runtime/physics";
import { equipped } from "./setup";

it("0석·0설비·0매출로 시작하며 준비 전 영업을 거부한다", () => {
  const state = createGame();
  expect(state.seats).toEqual({}); expect(state.counter).toBe(false);
  expect(state.inventory).toEqual({ counter: 0, seat: 0 });
  expect(state.cash).toBe(STARTING_CASH); expect(state.revenue).toBe(0);
  expect(command(state, { type: "open" }).open).toBe(false);
  expect(command(state, { type: "arrive" }).customers).toHaveLength(0);
});
it("구매는 재고만 늘리고 설치에서만 좌석과 설비가 생긴다", () => {
  let state = createGame();
  state = command(state, { type: "buy", item: "seat" });
  expect(state.seats).toEqual({}); expect(state.inventory.seat).toBe(1);
  expect(state.cash).toBe(STARTING_CASH - CATALOG.seat.price);
  expect(command(state, { type: "install-seat", seatId: "99" })).toBe(state);
  state = command(state, { type: "install-seat", seatId: "06" });
  expect(state.seats).toEqual({ "06": null }); expect(state.inventory.seat).toBe(0);
  expect(command(state, { type: "install-seat", seatId: "06" })).toBe(state);
  expect(command(state, { type: "open" }).open).toBe(false);
  state = command(command(state, { type: "buy", item: "counter" }), { type: "install-counter" });
  expect(command(state, { type: "open" }).open).toBe(true);
  expect(state.cash + state.spent).toBe(STARTING_CASH);
});
it("자금 부족·카운터 중복 구매·설치 한도를 방어한다", () => {
  let state = createGame();
  for (let i = 0; i < 9; i++) state = command(state, { type: "buy", item: "seat" });
  expect(state.inventory.seat).toBe(3); expect(state.cash).toBe(400_000);
  state = command(state, { type: "buy", item: "counter" });
  const duplicate = command(state, { type: "buy", item: "counter" });
  expect(duplicate.cash).toBe(state.cash); expect(duplicate.inventory.counter).toBe(1);
  const full = equipped(12);
  expect(command(full, { type: "buy", item: "seat" }).inventory.seat).toBe(0);
});
it("영업 중과 마감 후 손님 퇴장 전에는 설치할 수 없다", () => {
  let state = command(equipped(), { type: "buy", item: "seat" });
  state = command(state, { type: "open" });
  expect(command(state, { type: "install-seat", seatId: "01" }).inventory.seat).toBe(1);
  state = command(command(state, { type: "arrive" }), { type: "close" });
  expect(command(state, { type: "install-seat", seatId: "01" }).seats["01"]).toBeUndefined();
});
it("창업 자금·구매 지출·영업 매출을 분리해 첫 영업을 정산한다", () => {
  let state: GameState = createGame();
  state = command(command(state, { type: "buy", item: "counter" }), { type: "install-counter" });
  state = command(command(state, { type: "buy", item: "seat" }), { type: "install-seat", seatId: "06" });
  state = command(command(command(state, { type: "open" }), { type: "arrive" }), { type: "close" });
  for (let i = 0; i < 1800; i++) state = step(state);
  expect(state.served).toBe(1); expect(state.revenue).toBe(1500);
  expect(state.cash).toBe(STARTING_CASH - state.spent + state.revenue);
});
it("빈 구역에는 보이지 않는 충돌이 없고 설치한 설비만 충돌한다", async () => {
  const p = await createPhysics();
  try {
    for (let i = 0; i < 50; i++) p.move(.05, 0);
    expect(p.position().x).toBeGreaterThan(2);
    p.reset(); p.syncFurniture([], true);
    for (let i = 0; i < 50; i++) p.move(.05, 0);
    expect(p.position().x).toBeLessThan(.88);
    p.syncFurniture([], false); p.reset();
    for (let i = 0; i < 50; i++) p.move(.05, 0);
    expect(p.position().x).toBeGreaterThan(2);
  } finally { p.dispose(); }
});
