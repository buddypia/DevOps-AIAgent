export const project = {
  "rank": 12,
  "ideaNo": "201",
  "name": "Data Pipeline Sheriff",
  "slug": "12-data-pipeline-sheriff",
  "packageName": "data-pipeline-sheriff",
  "role": "data pipeline operations agent",
  "tagline": "Judges ETL delay, missing data, and rerun safety.",
  "overview": "Monitors ETL logs, lateness, and missing partitions to decide rerun, hold, or escalate.",
  "mvp": "A pipeline incident board that recommends data recovery actions and downstream communication.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "BigQuery"
  ],
  "focusAreas": [
    "missing partitions",
    "rerun safety",
    "downstream blast radius"
  ],
  "metrics": [
    "Data freshness",
    "Rerun safety",
    "Downstream impact"
  ],
  "positive": "RERUN",
  "caution": "HOLD DATA",
  "negative": "ESCALATE",
  "accent": "#0e7490",
  "secondary": "#9333ea",
  "sampleTarget": "daily_revenue_pipeline 2026-05-13",
  "sampleContext": "The daily revenue BigQuery table is late. Finance dashboard refresh is due in 35 minutes.",
  "sampleSignals": "ETL logs: extract complete, transform failed on null currency_code, partition 2026-05-12 missing 18% rows. Upstream source emitted schema warning. Last successful run 24h ago. Rerun cost estimate low. Dashboard SLA 11:00 JST."
} as const;

export type ProjectConfig = typeof project;
