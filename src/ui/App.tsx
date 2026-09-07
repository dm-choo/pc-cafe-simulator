import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import type { Engine } from '../runtime/engine';
import { SEATS } from '../content/cafe';
function Panel({ title, children, close }: { title: string; children: ReactNode; close?: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = ref.current; panel?.querySelector<HTMLElement>('button, input, select')?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>('button, input, select, [tabindex="0"]'));
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    panel?.addEventListener('keydown', trap); return () => panel?.removeEventListener('keydown', trap);
  }, [title]);
  return <div className="scrim"><section ref={ref} className="panel" role="dialog" aria-modal="true" aria-label={title}>
    <div className="panel-heading"><span className="eyebrow">ONDO PC / MY FIRST CAFE</span>{close ? <button className="icon" onClick={close} aria-label="닫기">×</button> : null}</div>
    <h1>{title}</h1>{children}
  </section></div>;
}
export function App({ engine }: { engine: Engine }) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const resume = () => engine.start(false);
  return <>
    <header className="hud"><div className="brand"><span className="brand-mark">온도<span>PC</span></span><span className="tag">첫 매장</span></div><div className="store-state"><i /> 개점 준비 <span className="divider" /> 12석</div></header>
    {s.mode === 'play' ? <>
      <div className="crosshair" />
      {s.target ? <button className="interaction" onClick={engine.interact}><kbd>E</kbd><span>{s.target}<small>살펴보기</small></span></button> : null}
      <footer className="play-controls"><span><kbd>W A S D</kbd> 이동</span><span>{s.locked ? '마우스 · 둘러보기' : '드래그 / 방향키 · 둘러보기'}</span><button onClick={engine.layout}><kbd>B</kbd> 배치</button><button onClick={engine.pause}><kbd>ESC</kbd> 메뉴</button></footer>
      {s.message ? <div className="toast" role="status">{s.message}</div> : null}
    </> : null}
    {s.mode === 'welcome' ? <Panel title="내 PC방의 첫날">
      <p className="intro">불을 켜고, 자리를 살펴보고.<br />이제 이 공간을 내 매장으로 만들어 보세요.</p>
      <div className="chapter"><span>01</span><div><strong>매장 둘러보기</strong><p>좌석 통로와 카운터를 확인하세요.</p></div></div>
      <button className="primary" onClick={() => engine.start()}>매장 들어가기 <span>→</span></button>
      <div className="secondary-actions"><button onClick={resume}>마우스 잠금 없이 시작</button><button onClick={engine.settings}>설정</button></div>
      <p className="footnote">개발 중 · 첫 공간과 조작을 확인하는 버전입니다.<br />손님과 영업 기능은 다음 업데이트에 추가됩니다.</p>
      <p className="mobile-note">현재 버전은 키보드와 마우스가 있는 PC에서 플레이하세요.</p>
    </Panel> : null}
    {s.mode === 'pause' ? <Panel title="잠시 쉬어가기">
      <p className="intro">매장 시간이 멈췄습니다.</p>
      <button className="primary" onClick={() => engine.start()}>매장으로 돌아가기 <span>→</span></button>
      <button className="wide" onClick={resume}>마우스 잠금 없이 계속</button>
      <div className="menu-grid"><button onClick={engine.layout}>배치 살펴보기</button><button onClick={engine.settings}>설정</button></div>
      <details><summary>조작 방법</summary><p>WASD 이동 · 마우스/방향키 시선 · E 살펴보기 · B 배치 · ESC/P 일시정지</p><p>배치 모드에서는 좌석을 선택하고 마우스로 위치를 미리 볼 수 있습니다. 실제 이동은 아직 적용되지 않습니다.</p></details>
      {s.debug ? <button className="quiet" onClick={engine.reset}>개발 장면 초기화</button> : null}
    </Panel> : null}
    {s.mode === 'counter' ? <Panel title="카운터" close={resume}>
      <p className="intro">우리 매장의 하루가 시작되는 자리.</p>
      <div className="summary-row"><span>영업 상태</span><strong>개점 준비</strong></div>
      <div className="summary-row"><span>설치된 좌석</span><strong>12석</strong></div>
      <div className="seat-grid">{SEATS.map(seat => <span key={seat.id}>{seat.id}<i /></span>)}</div>
      <p className="footnote">현재는 매장 점검 단계입니다. 손님 접수와 매출 정산은 다음 업데이트에 연결됩니다.</p>
      <button className="primary" onClick={resume}>점검 계속하기 <span>→</span></button>
    </Panel> : null}
    {s.mode === 'seat' ? <Panel title={`${s.selectedSeat}번 좌석`} close={resume}>
      <span className="seat-tag">STANDARD / 기본석</span><p className="intro">책상, 모니터, 본체와 의자가<br />준비되어 있습니다.</p>
      <div className="summary-row"><span>배치</span><strong>{Number(s.selectedSeat) <= 6 ? '왼쪽 좌석열' : '오른쪽 좌석열'}</strong></div>
      <p className="footnote">공간 확인용 임시 장비입니다. 실존 제품의 모델·성능·가격은 아직 연결하지 않았습니다.</p>
      <button className="primary" onClick={resume}>매장으로 돌아가기 <span>→</span></button>
    </Panel> : null}
    {s.mode === 'layout' ? <>
      <section className="layout-panel" aria-label="배치 모드"><span className="eyebrow">FLOOR PLAN</span><h1>매장 배치</h1><p>시간이 멈췄습니다.</p>
        <label>살펴볼 좌석<select value={s.selectedSeat ?? ''} onChange={e => engine.selectSeat(e.target.value)}><option value="" disabled>좌석 선택</option>{SEATS.map(seat => <option key={seat.id} value={seat.id}>{seat.id}번 좌석</option>)}</select></label>
        <p className="footnote">좌석을 클릭한 뒤 마우스를 움직여 위치를 미리 보세요. 현재 배치는 바뀌지 않습니다.</p>
        <button className="primary" onClick={resume}>둘러보기로 돌아가기</button>
      </section><div className="layout-caption" role="status">{s.preview || '좌석 선택 · 위치 미리보기'}</div>
    </> : null}
    {s.mode === 'settings' ? <Panel title="설정" close={engine.closeSettings}>
      <label className="setting">그래픽 품질<select value={s.quality} onChange={e => engine.quality(e.target.value as 'standard' | 'low')}><option value="standard">기본 · 그림자 켜짐</option><option value="low">낮음 · 그림자 꺼짐</option></select></label>
      <p className="footnote">낮음은 렌더 해상도와 그림자만 조절합니다.</p>
      <label className="setting">마우스 감도 <output>{s.sensitivity.toFixed(1)}</output><input type="range" min="0.4" max="2" step="0.1" value={s.sensitivity} onChange={e => engine.sensitivity(Number(e.target.value))} /></label>
      <button className="primary" onClick={engine.closeSettings}>완료</button>
    </Panel> : null}
    {s.mode === 'error' ? <Panel title="그래픽 연결 확인"><p>{s.message}</p><button className="primary" onClick={() => location.reload()}>다시 불러오기</button></Panel> : null}
    {s.debug ? <aside className="debug" aria-label="개발 정보">BASIC-12 · tick {s.tick} · {s.calls} calls · {s.triangles.toLocaleString()} tris · lag {Math.round(s.lag)} ms</aside> : null}
  </>;
}
