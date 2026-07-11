export const project = {
  "rank": 8,
  "ideaNo": "027",
  "name": "Recovery Confidence Meter",
  "slug": "08-recovery-confidence-meter",
  "packageName": "recovery-confidence-meter",
  "role": "recovery verification agent",
  "tagline": "Checks whether recovery is real or just temporarily quiet.",
  "overview": "Compares recovery-period logs and metrics against healthy baselines to determine confidence.",
  "mvp": "A recovery meter with confidence scoring, residual risk, and evidence to close or continue the incident.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "Cloud Monitoring"
  ],
  "focusAreas": [
    "baseline comparison",
    "residual symptoms",
    "closure criteria"
  ],
  "metrics": [
    "Recovery confidence",
    "Residual noise",
    "Baseline match"
  ],
  "positive": "CLOSE",
  "caution": "VERIFY",
  "negative": "KEEP INCIDENT OPEN",
  "accent": "#0369a1",
  "secondary": "#65a30d",
  "sampleTarget": "incident INC-1042 recovery review",
  "sampleContext": "A payment timeout incident was mitigated by rolling back one Cloud Run revision. Team wants to close the incident.",
  "sampleSignals": "After rollback: 5xx 0.25%, p95 290ms, retry warnings 5/min down from 180/min. Checkout success back to 98.8% baseline. One customer report arrived 6 minutes after rollback. DB latency normal."
} as const;

export type ProjectConfig = typeof project;
