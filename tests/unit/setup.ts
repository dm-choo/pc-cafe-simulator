import { command, createGame, type GameState } from "../../src/sim/game";
import { SEATS } from "../../src/content/cafe";
// Funded fixture for testing full shops; production always uses createGame() at zero seats.
export function equipped(count = 1): GameState {
  let state: GameState = { ...createGame(), cash: 20_000_000 };
  state = command(command(state, { type: "buy", item: "counter" }), { type: "install-counter" });
  for (const seat of [...SEATS].reverse().slice(0, count))
    state = command(command(state, { type: "buy", item: "seat" }), { type: "install-seat", seatId: seat.id });
  return state;
}
