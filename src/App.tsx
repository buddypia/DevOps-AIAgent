import { lazy, Suspense } from "react";
import "./styles.css";

export type * from "./AppHome";

const AppHome = lazy(() => import("./AppHome"));
const HomepageBuyerDecisionCockpitPage = lazy(() => import("./HomepageBuyerDecisionCockpitPage"));
const QuickBuyerEvidencePackSharePage = lazy(() => import("./QuickBuyerEvidencePackSharePage"));

function BuyerEvidencePackFallback() {
  return (
    <main className="quick-buyer-evidence-share-page watch" aria-busy="true" aria-label="Shared buyer evidence pack">
      <section className="quick-buyer-evidence-share-empty">
        <span>Buyer evidence pack</span>
        <h1>Loading shared evidence pack</h1>
        <p>Preparing the verifiable buyer evidence view.</p>
      </section>
    </main>
  );
}

function HomeFallback() {
  return (
    <main className="app-shell" aria-busy="true" aria-label="BuddyPia workspace">
      <div className="deferred-panel-placeholder" style={{ minHeight: 360 }} aria-hidden="true" />
    </main>
  );
}

export default function App() {
  const pathName = typeof window === "undefined" ? "/" : window.location.pathname;
  if (pathName === "/quick-buyer-evidence-pack") {
    return (
      <Suspense fallback={<BuyerEvidencePackFallback />}>
        <QuickBuyerEvidencePackSharePage />
      </Suspense>
    );
  }

  if (pathName === "/buyer-decision-cockpit") {
    return (
      <Suspense fallback={<BuyerEvidencePackFallback />}>
        <HomepageBuyerDecisionCockpitPage />
      </Suspense>
    );
  }

  if (pathName === "/judge-tools") {
    return (
      <Suspense fallback={<HomeFallback />}>
        <AppHome view="judge-tools" />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<HomeFallback />}>
      <AppHome />
    </Suspense>
  );
}
