import { FileText, Rocket, TrendingUp } from "lucide-react";
import type { BuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun";
import type { BuyerValueScenario, BuyerValueScenarioInput } from "./buyerValueScenario";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import type { BuyerCommercialOfferSnapshot } from "./App";

export const BUYER_VALUE_TUNER_FIELDS = [
  {
    key: "adoptionRatePercent",
    label: "Adoption",
    suffix: "%",
    min: 5,
    max: 100,
    step: 5
  },
  { key: "cyclesPerMonth", label: "Cycles / mo", suffix: "", min: 1, max: 40, step: 1 },
  { key: "manualHoursPerCycle", label: "Manual h / cycle", suffix: "h", min: 1, max: 120, step: 1 }
] as const;

export const BUYER_MEASURED_RUN_TUNER_FIELDS = [
  { key: "observedManualMinutes", label: "Manual run", suffix: "min", min: 10, max: 240, step: 5 },
  { key: "observedAssistedMinutes", label: "Agent run", suffix: "min", min: 5, max: 180, step: 5 }
] as const;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

export default function BuyerValueTunerStrip({
  buyerScenario,
  buyerScenarioInput,
  commercialOffer,
  measuredRun,
  measuredRunSummary,
  valueReportHref,
  deliveryMemoHref,
  launchRoomHref,
  onBuyerScenarioChange,
  onMeasuredRunChange
}: {
  buyerScenario: BuyerValueScenario;
  buyerScenarioInput: BuyerValueScenarioInput;
  commercialOffer: BuyerCommercialOfferSnapshot;
  measuredRun: PilotRunReceiptInput;
  measuredRunSummary: BuyerPilotMeasuredRunSummary;
  valueReportHref: string;
  deliveryMemoHref: string;
  launchRoomHref: string;
  onBuyerScenarioChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  onMeasuredRunChange: (patch: Partial<PilotRunReceiptInput>) => void;
}) {
  const measuredSupportRatio = Math.round((measuredRunSummary.measuredMonthlyValueYen / Math.max(1, buyerScenario.monthlyGrossValueYen)) * 100);
  const firstAction = buyerScenario.nextActions[0];
  const firstOpenGuardrail = commercialOffer.guardrails.find((guardrail) => guardrail.status !== "ready");
  const priceLabel = commercialOffer.firstCommitmentYen > 0 ? yen(commercialOffer.firstCommitmentYen) : "Hold";
  const paybackLabel = commercialOffer.firstCommitmentYen > 0 && commercialOffer.paybackDays < 999 ? `${commercialOffer.paybackDays}d` : "Hold";
  const stopRule =
    firstOpenGuardrail?.rule ??
    commercialOffer.guardrails.find((guardrail) => guardrail.id === "operating-gate")?.rule ??
    "Expansion waits for measured value, trust controls, and the day-30 renewal decision.";

  return (
    <section className="buyer-proof-value-tuner" aria-label="Buyer value tuner">
      <div className="buyer-proof-value-tuner-head">
        <div>
          <span>Buyer value tuner</span>
          <strong>Change the buying case, then open the updated memo</strong>
          <p>Adjust adoption, review volume, and measured pilot minutes. The delivery memo and launch room recalculate from the same workspace.</p>
        </div>
        <div className="buyer-proof-value-actions">
          <a href={valueReportHref} target="_blank" rel="noreferrer">
            <TrendingUp size={14} />
            Value report
          </a>
          <a href={deliveryMemoHref} target="_blank" rel="noreferrer">
            <FileText size={14} />
            Updated memo
          </a>
          <a href={launchRoomHref} target="_blank" rel="noreferrer">
            <Rocket size={14} />
            Launch room
          </a>
        </div>
      </div>
      <div className="buyer-proof-value-metrics" aria-label="Current buyer value metrics">
        <article>
          <span>Modeled value</span>
          <strong>{yen(buyerScenario.monthlyGrossValueYen)}</strong>
          <small>
            {buyerScenario.monthlyHoursSaved}h/month, {buyerScenario.paybackDays}d payback
          </small>
        </article>
        <article>
          <span>Measured value</span>
          <strong>{yen(measuredRunSummary.measuredMonthlyValueYen)}</strong>
          <small>
            {measuredRunSummary.actualMinutesSavedPerRun}m saved/run, {measuredRunSummary.acceptanceRatePercent}% accepted
          </small>
        </article>
        <article>
          <span>Evidence support</span>
          <strong>{measuredSupportRatio}%</strong>
          <small>{measuredRunSummary.readiness}</small>
        </article>
      </div>
      <div className={cx("buyer-proof-value-offer", `is-${commercialOffer.status}`)} aria-label="Pilot price guardrail">
        <div>
          <span>Pilot price guardrail</span>
          <strong>{priceLabel}</strong>
          <p>{commercialOffer.contractLine}</p>
        </div>
        <article>
          <span>Value cover</span>
          <strong>{commercialOffer.valueCoveragePercent}%</strong>
          <small>{yen(commercialOffer.expectedMonthlyValueYen)} expected monthly value</small>
        </article>
        <article>
          <span>Payback</span>
          <strong>{paybackLabel}</strong>
          <small>{commercialOffer.recommendedTier}</small>
        </article>
        <article>
          <span>Stop rule</span>
          <strong>{firstOpenGuardrail ? firstOpenGuardrail.label : "Expansion gate"}</strong>
          <small>{stopRule}</small>
        </article>
      </div>
      <div className="buyer-proof-value-controls" aria-label="Buyer value controls">
        {BUYER_VALUE_TUNER_FIELDS.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <b>
              {buyerScenarioInput[field.key]} {field.suffix}
            </b>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={buyerScenarioInput[field.key]}
              onChange={(event) => onBuyerScenarioChange({ [field.key]: Number(event.target.value) } as Partial<BuyerValueScenarioInput>)}
            />
          </label>
        ))}
        {BUYER_MEASURED_RUN_TUNER_FIELDS.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <b>
              {measuredRun[field.key]} {field.suffix}
            </b>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={measuredRun[field.key]}
              onChange={(event) => onMeasuredRunChange({ [field.key]: Number(event.target.value) } as Partial<PilotRunReceiptInput>)}
            />
          </label>
        ))}
      </div>
      <div className="buyer-proof-value-next">
        <span>Next value proof</span>
        <strong>{firstAction ? firstAction.owner : "Cloud Run SRE"}</strong>
        <p>{firstAction ? firstAction.action : "Seal this value claim with fresh launch evidence and keep the buyer memo current."}</p>
      </div>
    </section>
  );
}
