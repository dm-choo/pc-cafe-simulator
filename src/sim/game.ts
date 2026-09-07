import { SEATS, localPoint, type Point } from "../content/cafe";
import { planRoute } from "./navigation";
export const ENTRY: Point = { x: 0, z: 6.25 };
export const SESSION_TICKS = 800; // 40 sim seconds represents a one-hour trial session.
export const TRIAL_PRICE_WON = 1500; // Balance assumption, not verified 2026-01-01 market data.
export type Customer = Readonly<{
  id: number;
  seatId: string;
  phase: "walking" | "using" | "leaving";
  position: Point;
  route: readonly Point[];
  returnRoute: readonly Point[];
  waypoint: number;
  endsAt: number;
}>;
export type Receipt = Readonly<{
  customerId: number;
  seatId: string;
  amount: number;
  tick: number;
}>;
export type GameState = Readonly<{
  version: 2;
  tick: number;
  selectedSeat: string | null;
  open: boolean;
  nextArrival: number;
  nextCustomerId: number;
  customers: readonly Customer[];
  seats: Readonly<Record<string, number | null>>;
  cash: number;
  served: number;
  lostFull: number;
  lostPath: number;
  receipts: readonly Receipt[];
  notice: string;
}>;
export type Command =
  | { type: "select-seat"; seatId: string | null }
  | { type: "reset" }
  | { type: "open" }
  | { type: "close" }
  | { type: "arrive" }
  | { type: "finish-session"; customerId: number };
export function createGame(): GameState {
  return {
    version: 2,
    tick: 0,
    selectedSeat: null,
    open: false,
    nextArrival: 0,
    nextCustomerId: 1,
    customers: [],
    seats: Object.fromEntries(SEATS.map((s) => [s.id, null])),
    cash: 0,
    served: 0,
    lostFull: 0,
    lostPath: 0,
    receipts: [],
    notice: "카운터에서 첫 영업을 시작하세요",
  };
}
function release(state: GameState, c: Customer): GameState {
  return {
    ...state,
    seats: {
      ...state.seats,
      [c.seatId]: state.seats[c.seatId] === c.id ? null : state.seats[c.seatId],
    },
  };
}
export function command(state: GameState, action: Command): GameState {
  switch (action.type) {
    case "reset":
      return createGame();
    case "select-seat":
      return action.seatId !== null &&
        !SEATS.some((s) => s.id === action.seatId)
        ? state
        : { ...state, selectedSeat: action.seatId };
    case "open":
      return state.open
        ? state
        : {
            ...state,
            open: true,
            nextArrival: state.tick + 40,
            notice: "영업을 시작했습니다. 첫 손님을 기다려 보세요",
          };
    case "close":
      return {
        ...state,
        open: false,
        notice: state.customers.length
          ? "신규 입장을 중지했습니다. 이용 중인 손님은 마저 이용합니다"
          : "영업을 마쳤습니다",
      };
    case "arrive": {
      if (!state.open) return state;
      const free = SEATS.filter((s) => state.seats[s.id] === null).sort(
        (a, b) => Math.abs(a.z - ENTRY.z) - Math.abs(b.z - ENTRY.z),
      );
      if (!free.length)
        return {
          ...state,
          lostFull: state.lostFull + 1,
          notice: "빈자리가 없어 손님이 돌아갔습니다",
        };
      for (const seat of free) {
        const approach = localPoint(seat, 0.72, 0.8),
          route = planRoute(ENTRY, approach);
        if (!route) continue;
        const id = state.nextCustomerId;
        const c: Customer = {
          id,
          seatId: seat.id,
          phase: "walking",
          position: { ...ENTRY },
          route,
          returnRoute: [...route].reverse(),
          waypoint: 1,
          endsAt: 0,
        };
        return {
          ...state,
          nextCustomerId: id + 1,
          customers: [...state.customers, c],
          seats: { ...state.seats, [seat.id]: id },
          notice: `손님이 ${seat.id}번 자리로 이동합니다`,
        };
      }
      return {
        ...state,
        lostPath: state.lostPath + 1,
        notice: "이동 가능한 자리가 없어 손님이 돌아갔습니다",
      };
    }
    case "finish-session": {
      const c = state.customers.find((c) => c.id === action.customerId);
      if (
        !c ||
        c.phase !== "using" ||
        state.tick < c.endsAt ||
        state.receipts.some((r) => r.customerId === c.id)
      )
        return state;
      const receipt = {
        customerId: c.id,
        seatId: c.seatId,
        amount: TRIAL_PRICE_WON,
        tick: state.tick,
      };
      const next = release(state, c);
      return {
        ...next,
        cash: state.cash + receipt.amount,
        served: state.served + 1,
        receipts: [...state.receipts, receipt].slice(-30),
        customers: state.customers.map((v) =>
          v.id === c.id
            ? { ...v, phase: "leaving", route: c.returnRoute, waypoint: 0 }
            : v,
        ),
        notice: `${c.seatId}번 이용 종료 · +${TRIAL_PRICE_WON.toLocaleString("en-US")}원`,
      };
    }
  }
}
export function step(previous: GameState): GameState {
  let state: GameState = { ...previous, tick: previous.tick + 1 };
  if (state.open && state.tick >= state.nextArrival)
    state = command(
      { ...state, nextArrival: state.tick + 600 },
      { type: "arrive" },
    );
  const moving: Customer[] = [];
  for (const c of state.customers) {
    if (c.phase === "using") {
      moving.push(c);
      continue;
    }
    if (!c.route.length) {
      state = release(state, c);
      state = {
        ...state,
        lostPath: state.lostPath + 1,
        notice: "동선 오류로 예약을 해제했습니다",
      };
      continue;
    }
    let position = { ...c.position },
      waypoint = c.waypoint,
      remaining = 1.15 * 0.05;
    while (remaining > 0 && waypoint < c.route.length) {
      const p = c.route[waypoint],
        dx = p.x - position.x,
        dz = p.z - position.z,
        d = Math.hypot(dx, dz);
      if (d <= remaining) {
        position = { ...p };
        remaining -= d;
        waypoint++;
      } else {
        position = {
          x: position.x + (dx / d) * remaining,
          z: position.z + (dz / d) * remaining,
        };
        remaining = 0;
      }
    }
    if (waypoint === c.route.length) {
      if (c.phase === "leaving") continue;
      const seat = SEATS.find((s) => s.id === c.seatId)!;
      moving.push({
        ...c,
        phase: "using",
        position: localPoint(seat, 0, 0.8),
        waypoint,
        endsAt: state.tick + SESSION_TICKS,
      });
    } else moving.push({ ...c, position, waypoint });
  }
  state = { ...state, customers: moving };
  for (const c of moving)
    if (c.phase === "using" && state.tick >= c.endsAt)
      state = command(state, { type: "finish-session", customerId: c.id });
  return state;
}
