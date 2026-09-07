import { describe, it, expect } from "vitest";
import {
  command,
  createGame,
  step,
  TRIAL_PRICE_WON,
  type GameState,
} from "../../src/sim/game";
import { planRoute } from "../../src/sim/navigation";
import { FixedClock } from "../../src/runtime/clock";
import { SEATS, localPoint } from "../../src/content/cafe";
function ticks(state: GameState, count: number) {
  for (let i = 0; i < count; i++) state = step(state);
  return state;
}
const admit = () =>
  command(command(createGame(), { type: "open" }), { type: "arrive" });
describe("첫 영업", () => {
  it("실제 12석 접근점까지 가구를 피해 경로를 찾는다", () => {
    for (const s of SEATS)
      expect(
        planRoute({ x: 0, z: 6.25 }, localPoint(s, 0.72, 0.8)),
        s.id,
      ).not.toBeNull();
    expect(planRoute({ x: 0, z: 6.25 }, { x: 20, z: 20 })).toBeNull();
  });
  it("입장과 함께 좌석을 예약하고 만석에서는 중복 배정하지 않는다", () => {
    let state = command(createGame(), { type: "open" });
    for (let i = 0; i < 13; i++) state = command(state, { type: "arrive" });
    expect(state.customers).toHaveLength(12);
    expect(new Set(state.customers.map((c) => c.seatId)).size).toBe(12);
    expect(state.lostFull).toBe(1);
    expect(state.cash).toBe(0);
  });
  it("조기 종료를 거부하고, 이용 종료 결제는 재입력해도 한 번만 반영한다", () => {
    let state = command(admit(), { type: "close" });
    const id = state.customers[0].id;
    expect(command(state, { type: "finish-session", customerId: id })).toBe(
      state,
    );
    state = ticks(state, 400);
    expect(state.customers[0].phase).toBe("using");
    expect(state.cash).toBe(0);
    expect(command(state, { type: "finish-session", customerId: id })).toBe(
      state,
    );
    while (state.served === 0) state = step(state);
    expect(state.cash).toBe(TRIAL_PRICE_WON);
    expect(state.seats[state.customers[0].seatId]).toBeNull();
    expect(command(state, { type: "finish-session", customerId: id })).toBe(
      state,
    );
    state = ticks(state, 500);
    expect(state.customers).toHaveLength(0);
    expect(state.cash).toBe(TRIAL_PRICE_WON);
    expect(state.receipts).toHaveLength(1);
  });
  it("경로가 사라진 손님의 예약을 반환하고 결제하지 않는다", () => {
    let state = admit();
    const seatId = state.customers[0].seatId;
    state = step({
      ...state,
      customers: [{ ...state.customers[0], route: [] }],
    });
    expect(state.seats[seatId]).toBeNull();
    expect(state.customers).toHaveLength(0);
    expect(state.cash).toBe(0);
    expect(state.lostPath).toBe(1);
  });
  it("마감 후 새 손님은 없지만 이용 중인 손님은 결제하고 퇴장한다", () => {
    let state = command(admit(), { type: "close" });
    state = ticks(state, 1800);
    expect(state.nextCustomerId).toBe(2);
    expect(state.served).toBe(1);
    expect(state.customers).toHaveLength(0);
  });
  it("1배속과 4배속은 같은 tick에서 고객·좌석·매출이 같다", () => {
    function run(speed: number, duration: number) {
      let state = command(createGame(), { type: "open" });
      const clock = new FixedClock();
      for (let now = 0; now <= duration; now += 25)
        clock.advance(
          now,
          false,
          () => {
            state = step(state);
          },
          speed,
        );
      return state;
    }
    expect(run(1, 120000)).toEqual(run(4, 30000));
  });
});
