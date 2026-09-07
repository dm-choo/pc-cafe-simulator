import { describe, expect, it } from 'vitest';
import { FixedClock } from '../../src/runtime/clock';
import { command, createGame } from '../../src/sim/game';
import { createPhysics } from '../../src/runtime/physics';
import { placementReason } from '../../src/sim/layout';
import { SEATS } from '../../src/content/cafe';

describe('시간과 상태 경계', () => {
  it('프레임 속도가 달라도 같은 50ms 스텝을 실행한다', () => {
    function run(interval: number) { const c = new FixedClock(); let tick = 0; for (let t = 0; t <= 1000; t += interval) c.advance(t, false, () => tick++); return tick; }
    expect(run(10)).toBe(20); expect(run(25)).toBe(20);
  });
  it('배치/숨김/복귀 사이의 밀린 시간을 적용하지 않는다', () => {
    const c = new FixedClock(); let tick = 0; const step = () => tick++;
    c.advance(0, false, step); c.advance(100, false, step); expect(tick).toBe(2);
    c.advance(200, true, step); c.advance(60000, true, step); c.advance(120000, false, step); expect(tick).toBe(2);
    c.advance(120050, false, step); expect(tick).toBe(3);
  });
  it('과부하의 sim 시간을 버리지 않고 다음 프레임에서 처리한다', () => {
    const c = new FixedClock(); let tick = 0; c.advance(0, false, () => tick++);
    expect(c.advance(1000, false, () => tick++)).toBe(600); expect(tick).toBe(8);
    c.advance(1000, false, () => tick++); c.advance(1000, false, () => tick++); expect(tick).toBe(20);
  });
  it('없는 좌석 선택을 거부하고 기존 상태를 변경하지 않는다', () => {
    const initial = createGame(); expect(command(initial, { type: 'select-seat', seatId: '99' })).toBe(initial);
    const next = command(initial, { type: 'select-seat', seatId: '01' }); expect(initial.selectedSeat).toBeNull(); expect(next.selectedSeat).toBe('01');
    expect(JSON.parse(JSON.stringify(next))).toEqual(next);
  });
  it('배치 미리보기에서 통로·벽·기존 좌석 충돌을 알린다', () => {
    expect(placementReason(SEATS[0], 0, 0)).toContain('통로');
    expect(placementReason(SEATS[0], 5, 0)).toContain('벽');
    expect(placementReason(SEATS[0], SEATS[1].x, SEATS[1].z)).toContain('겹');
    expect(placementReason(SEATS[0], SEATS[0].x, SEATS[0].z)).toBeNull();
  });
});
it('Rapier가 전면 벽과 카운터 관통을 막고 초기 위치로 복원한다', async () => {
  const physics = await createPhysics();
  try {
    for (let i = 0; i < 300; i++) physics.move(0, -0.05);
    expect(physics.position().z).toBeGreaterThan(-6.7); expect(physics.position().z).toBeLessThan(-6.4);
    physics.reset(); for (let i = 0; i < 100; i++) physics.move(0.05, 0);
    expect(physics.position().x).toBeLessThan(0.88); expect(physics.position().x).toBeGreaterThan(0.7);
    physics.reset(); expect(physics.position().x).toBe(0); expect(physics.position().z).toBeCloseTo(5.9);
  } finally { physics.dispose(); }
});
