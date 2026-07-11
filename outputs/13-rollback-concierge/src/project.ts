export const project = {
  "rank": 13,
  "ideaNo": "005",
  "name": "Rollback Concierge",
  "slug": "13-rollback-concierge",
  "packageName": "rollback-concierge",
  "role": "rollback sequencing agent",
  "tagline": "Builds a safer rollback order across revisions and data changes.",
  "overview": "Looks at Cloud Run revisions, DB changes, and operational state to propose rollback sequencing.",
  "mvp": "A rollback planner that lists the safest order, verification checks, and irreversible steps.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging"
  ],
  "focusAreas": [
    "revision rollback",
    "data compatibility",
    "verification SQL"
  ],
  "metrics": [
    "Rollback safety",
    "Data risk",
    "Verification depth"
  ],
  "positive": "ROLLBACK READY",
  "caution": "MANUAL CHECK",
  "negative": "DO NOT ROLLBACK",
  "accent": "#b45309",
  "secondary": "#2563eb",
  "sampleTarget": "checkout-api rollback plan",
  "sampleContext": "New release changed retry handling and added nullable DB column payment_attempt_source.",
  "sampleSignals": "Cloud Run previous revision healthy. DB migration add-column only, no backfill. Feature flag can disable retry_v2. Logs show timeout spike. No irreversible delete migration. Verification SQL exists for failed checkout count."
} as const;

export type ProjectConfig = typeof project;
