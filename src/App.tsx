import { lazy, Suspense } from "react";
import "./styles.css";

const AppHome = lazy(() => import("./AppHome"));

function HomeFallback() {
  return (
    <main className="app-shell" aria-busy="true" aria-label="運用調査コンソール">
      <div className="deferred-panel-placeholder" style={{ minHeight: 360 }} aria-hidden="true" />
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <AppHome />
    </Suspense>
  );
}
