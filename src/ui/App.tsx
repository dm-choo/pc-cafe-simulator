import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { Engine } from "../runtime/engine";
import { SEATS } from "../content/cafe";
import { CATALOG, STARTING_CASH, type ShopItem } from "../content/shop";
function Panel({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = ref.current;
    panel?.querySelector<HTMLElement>("button, input, select")?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ),
      );
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    panel?.addEventListener("keydown", trap);
    return () => panel?.removeEventListener("keydown", trap);
  }, [title]);
  return (
    <div className="scrim">
      <section
        ref={ref}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="panel-heading">
          <span className="eyebrow">ONDO PC / MY FIRST CAFE</span>
          {close ? (
            <button className="icon" onClick={close} aria-label="닫기">
              ×
            </button>
          ) : null}
        </div>
        <h1>{title}</h1>
        {children}
      </section>
    </div>
  );
}
export function App({ engine }: { engine: Engine }) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const resume = () => engine.start(false);
  const state = s.game;
  const installed = Object.keys(state.seats).length;
  const constructionBlocked = state.open || state.customers.length > 0;
  const occupied = Object.values(state.seats).filter(
    (id) => id !== null,
  ).length;
  const trading = state.open
    ? "영업 중"
    : state.customers.length
      ? "마감 중"
      : "개점 준비";
  const seatState = (id: string) => {
    if (!(id in state.seats)) return "미설치";
    const c = state.customers.find((c) => c.id === state.seats[id]);
    return c ? (c.phase === "using" ? "이용 중" : "이동 중") : "빈자리";
  };
  return (
    <>
      <header className="hud">
        <div className="brand">
          <span className="brand-mark">
            온도<span>PC</span>
          </span>
          <span className="tag">첫 매장</span>
        </div>
        <div className="store-state">
          <i /> {trading} <span className="divider" /> <span aria-label="좌석 현황">{occupied}/{installed}석</span>{" "}
          <span className="divider" />
          <strong aria-label="보유 현금">
            {state.cash.toLocaleString()}원
          </strong>
        </div>
      </header>
      {s.mode === "play" ? (
        <>
          <div className="crosshair" />
          <aside className="business-hint">
            <span>{state.notice}</span>
            <div className="speed-controls" aria-label="영업 배속">
              <button
                aria-pressed={s.speed === 1}
                onClick={() => engine.speed(1)}
              >
                1×
              </button>
              <button
                aria-pressed={s.speed === 4}
                onClick={() => engine.speed(4)}
              >
                4×
              </button>
            </div>
          </aside>
          {s.target ? (
            <button className="interaction" onClick={engine.interact}>
              <kbd>E</kbd>
              <span>
                {s.target}
                <small>살펴보기</small>
              </span>
            </button>
          ) : null}
          <footer className="play-controls">
            <span>
              <kbd>W A S D</kbd> 이동
            </span>
            <span>
              {s.locked ? "마우스 · 둘러보기" : "드래그 / 방향키 · 둘러보기"}
            </span>
            <button onClick={engine.shop}><kbd>N</kbd> 구매</button>
            <button onClick={engine.layout}>
              <kbd>B</kbd> 배치
            </button>
            <button onClick={engine.pause}>
              <kbd>ESC</kbd> 메뉴
            </button>
          </footer>
          {s.message ? (
            <div className="toast" role="status">
              {s.message}
            </div>
          ) : null}
        </>
      ) : null}
      {s.mode === "welcome" ? (
        <Panel title="내 PC방의 첫날">
          <p className="intro">
            아직 책상 하나 없는, 나의 첫 매장.
            <br />
            이제 이 공간을 내 매장으로 만들어 보세요.
          </p>
          <div className="chapter">
            <span>01</span>
            <div>
              <strong>0석에서 시작하기</strong>
              <p>창업자금 {STARTING_CASH.toLocaleString()}원 · 구매 → 설치 → 첫 영업</p>
            </div>
          </div>
          <button className="primary" onClick={() => engine.start()}>
            매장 들어가기 <span>→</span>
          </button>
          <div className="secondary-actions">
            <button onClick={resume}>마우스 잠금 없이 시작</button>
            <button onClick={engine.settings}>설정</button>
          </div>
          <p className="footnote">
            개발 중 · 첫 손님과 첫 매출까지 플레이할 수 있습니다.
            <br />
            새로고침하면 진행이 초기화됩니다.
          </p>
          <p className="mobile-note">
            현재 버전은 키보드와 마우스가 있는 PC에서 플레이하세요.
          </p>
        </Panel>
      ) : null}
      {s.mode === "pause" ? (
        <Panel title="잠시 쉬어가기">
          <p className="intro">매장 시간이 멈췄습니다.</p>
          <button className="primary" onClick={() => engine.start()}>
            매장으로 돌아가기 <span>→</span>
          </button>
          <button className="wide" onClick={resume}>
            마우스 잠금 없이 계속
          </button>
          <div className="menu-grid">
            <button onClick={engine.shop}>설비 구매</button>
            <button onClick={engine.layout}>배치 살펴보기</button>
            <button onClick={engine.settings}>설정</button>
          </div>
          <details>
            <summary>조작 방법</summary>
            <p>
              WASD 이동 · 마우스/방향키 시선 · E 살펴보기 · N 구매 · B 배치 · ESC/P
              일시정지
            </p>
            <p>
              구매한 설비는 배치 모드에서 설치합니다. 좌석은 지정된 12개 구역 중 선택하며, 영업 중에는 설치할 수 없습니다.
            </p>
          </details>
          {s.debug ? (
            <button className="quiet" onClick={engine.reset}>
              개발 장면 초기화
            </button>
          ) : null}
        </Panel>
      ) : null}
      {s.mode === "shop" ? (
        <Panel title="설비 구매" close={resume}>
          <p className="intro">첫 카운터, 첫 자리부터 채워 보세요.</p>
          {(Object.keys(CATALOG) as ShopItem[]).map(item => {
            const product = CATALOG[item];
            const full = item === "counter" ? state.counter || state.inventory.counter > 0 : installed + state.inventory.seat >= SEATS.length;
            return <article className="shop-item" key={item}>
              <h2>{product.name}</h2><p>{product.description}</p>
              <div className="summary-row"><strong>{product.price.toLocaleString()}원</strong><span>미설치 보유 {state.inventory[item]}개</span></div>
              <button className="wide" disabled={full || state.cash < product.price} onClick={() => engine.buy(item)}>{product.name} 구매</button>
            </article>;
          })}
          <p className="receipt" role="status">{state.notice}</p>
          <p className="footnote">창업자금과 구매 가격은 개발용 시험 값입니다. 2026-01-01 실제 시장 가격을 반영한 카탈로그는 아직 아닙니다.</p>
          <button className="primary" onClick={engine.layout}>구매한 설비 설치하기 →</button>
        </Panel>
      ) : null}
      {s.mode === "counter" ? (
        <Panel title="카운터" close={resume}>
          <p className="intro">우리 매장의 하루가 시작되는 자리.</p>
          <div className="summary-row">
            <span>영업 상태</span>
            <strong>{trading}</strong>
          </div>
          <div className="summary-row">
            <span>설치된 좌석</span>
            <strong>{installed}석</strong>
          </div>
          <div className="seat-grid">
            {SEATS.map((seat) => (
              <span
                key={seat.id}
                className={!(seat.id in state.seats) ? "uninstalled" : state.seats[seat.id] === null ? "" : "occupied"}
                title={`${seat.id}번 ${seatState(seat.id)}`}
              >
                {seat.id}
                <i />
              </span>
            ))}
          </div>
          <div className="summary-row">
            <span>누적 매출 · 결제 완료</span>
            <strong>
              {state.revenue.toLocaleString()}원 · {state.served}명
            </strong>
          </div>
          {state.receipts.length ? (
            <p className="receipt" aria-label="최근 결제">
              최근 결제 · {state.receipts.at(-1)!.seatId}번 자리 +
              {state.receipts.at(-1)!.amount.toLocaleString()}원
            </p>
          ) : null}
          <p className="footnote">
            시험 요금: 1시간 1,500원 · 약 40초 이용 후 자동 결제. 실제 시장
            가격이 아닌 개발용 밸런스 값입니다.
          </p>
          <button
            className="primary"
            disabled={!state.open && installed === 0}
            onClick={state.open ? engine.closeCafe : engine.openCafe}
          >
            {state.open ? "신규 입장 중지" : "영업 시작"}
          </button>
          <button className="wide" onClick={resume}>
            점검 계속하기 <span>→</span>
          </button>
        </Panel>
      ) : null}
      {s.mode === "seat" ? (
        <Panel title={`${s.selectedSeat}번 좌석`} close={resume}>
          <span className="seat-tag">
            STANDARD / 기본석 · {seatState(s.selectedSeat!)}
          </span>
          <p className="intro">
            책상, 모니터, 본체와 의자가
            <br />
            준비되어 있습니다.
          </p>
          <div className="summary-row">
            <span>배치</span>
            <strong>
              {Number(s.selectedSeat) <= 6 ? "왼쪽 좌석열" : "오른쪽 좌석열"}
            </strong>
          </div>
          <p className="footnote">
            공간 확인용 임시 장비입니다. 실존 제품의 모델·성능·가격은 아직
            연결하지 않았습니다.
          </p>
          <button className="primary" onClick={resume}>
            매장으로 돌아가기 <span>→</span>
          </button>
        </Panel>
      ) : null}
      {s.mode === "layout" ? (
        <>
          <section className="layout-panel" aria-label="배치 모드">
            <span className="eyebrow">FLOOR PLAN</span>
            <h1>매장 배치</h1>
            <p>시간이 멈췄습니다.</p>
            <div className="setup-status">카운터 {state.counter ? "설치됨" : "미설치"} · 좌석 {installed}/12개</div>
            <button className="wide" disabled={state.counter || state.inventory.counter < 1 || constructionBlocked} onClick={() => engine.install("counter")}>카운터 설치</button>
            <label>
              설치할 좌석 구역
              <select
                value={s.selectedSeat ?? ""}
                onChange={(e) => engine.selectSeat(e.target.value)}
              >
                <option value="" disabled>
                  좌석 선택
                </option>
                {SEATS.map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    {seat.id}번 · {seatState(seat.id)}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary" disabled={!s.selectedSeat || s.selectedSeat in state.seats || state.inventory.seat < 1 || constructionBlocked} onClick={() => engine.install("seat")}>선택한 구역에 좌석 설치</button>
            <p className="receipt" role="status">{s.message || state.notice}</p>
            <p className="footnote">
              미설치 보유: 카운터 {state.inventory.counter} · 좌석 {state.inventory.seat}. 지정 구역의 설비를 직접 설치합니다. {constructionBlocked ? "영업 종료 후 모든 손님이 퇴장해야 설치할 수 있습니다." : "아직 자유 이동·회전은 지원하지 않습니다."}
            </p>
            <button className="wide" onClick={engine.shop}>설비 구매로</button>
            <button className="primary" onClick={resume}>
              둘러보기로 돌아가기
            </button>
          </section>
          <div className="layout-caption" role="status">
            {s.preview || "좌석 구역 선택 → 설치 확정"}
          </div>
        </>
      ) : null}
      {s.mode === "settings" ? (
        <Panel title="설정" close={engine.closeSettings}>
          <label className="setting">
            그래픽 품질
            <select
              value={s.quality}
              onChange={(e) =>
                engine.quality(e.target.value as "standard" | "low")
              }
            >
              <option value="standard">기본 · 그림자 켜짐</option>
              <option value="low">낮음 · 그림자 꺼짐</option>
            </select>
          </label>
          <p className="footnote">낮음은 렌더 해상도와 그림자만 조절합니다.</p>
          <label className="setting">
            마우스 감도 <output>{s.sensitivity.toFixed(1)}</output>
            <input
              type="range"
              min="0.4"
              max="2"
              step="0.1"
              value={s.sensitivity}
              onChange={(e) => engine.sensitivity(Number(e.target.value))}
            />
          </label>
          <button className="primary" onClick={engine.closeSettings}>
            완료
          </button>
        </Panel>
      ) : null}
      {s.mode === "error" ? (
        <Panel title="그래픽 연결 확인">
          <p>{s.message}</p>
          <button className="primary" onClick={() => location.reload()}>
            다시 불러오기
          </button>
        </Panel>
      ) : null}
      {s.debug ? (
        <aside className="debug" aria-label="개발 정보">
          BASIC-12 · tick {s.tick} · {s.calls} calls ·{" "}
          {s.triangles.toLocaleString()} tris · lag {Math.round(s.lag)} ms
        </aside>
      ) : null}
    </>
  );
}
