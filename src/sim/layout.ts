import { SEATS, type Seat } from "../content/cafe";

export function placementReason(
  seat: Seat,
  x: number,
  z: number,
): string | null {
  if (Math.abs(x) > 4.15 || Math.abs(z) > 5.6)
    return "벽과 출입 공간을 확보하세요";
  if (Math.abs(x) < 2.35) return "중앙 통로는 비워 두세요";
  if (
    SEATS.some(
      (s) =>
        s.id !== seat.id && Math.abs(s.x - x) < 1.15 && Math.abs(s.z - z) < 1.5,
    )
  )
    return "다른 좌석과 겹칩니다";
  return null;
}
