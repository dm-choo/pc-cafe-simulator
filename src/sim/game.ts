import { SEATS } from '../content/cafe';
export type GameState = Readonly<{ version: 1; tick: number; selectedSeat: string | null }>;
export type Command = { type: 'select-seat'; seatId: string | null } | { type: 'reset' };
export function createGame(): GameState { return { version: 1, tick: 0, selectedSeat: null }; }
export function command(state: GameState, action: Command): GameState {
  if (action.type === 'reset') return createGame();
  if (action.seatId !== null && !SEATS.some(s => s.id === action.seatId)) return state;
  return { ...state, selectedSeat: action.seatId };
}
export function step(state: GameState): GameState { return { ...state, tick: state.tick + 1 }; }
