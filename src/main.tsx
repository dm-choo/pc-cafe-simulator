import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { createEngine } from "./runtime/engine";
import "./ui/style.css";
const root = createRoot(document.getElementById("root")!);
root.render(
  <div className="scrim">
    <section className="panel" role="status">
      <span className="eyebrow">ONDO PC</span>
      <h1>매장 불을 켜는 중</h1>
      <p className="intro">공간과 조작을 준비하고 있습니다.</p>
    </section>
  </div>,
);
try {
  const engine = await createEngine(
    document.getElementById("game") as HTMLCanvasElement,
  );
  root.render(<App engine={engine} />);
  if (
    import.meta.env.DEV ||
    new URLSearchParams(location.search).has("debug")
  ) {
    Object.defineProperty(window, "__cafe", {
      value: { read: engine.diagnostics },
      configurable: true,
    });
  }
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      root.unmount();
      engine.dispose();
    });
} catch (error) {
  console.error(error);
  root.render(
    <div className="scrim">
      <section className="panel" role="alert">
        <h1>매장을 열 수 없습니다</h1>
        <p className="intro">
          WebGL2와 하드웨어 가속을 지원하는 브라우저에서 다시 열어 주세요.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          다시 시도
        </button>
      </section>
    </div>,
  );
}
