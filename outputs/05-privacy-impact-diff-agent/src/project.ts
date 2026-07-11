export const project = {
  "rank": 5,
  "ideaNo": "226",
  "name": "Privacy Impact Diff Agent",
  "slug": "05-privacy-impact-diff-agent",
  "packageName": "privacy-impact-diff-agent",
  "role": "privacy diff reviewer",
  "tagline": "Finds personal-data collection, storage, logging, and transfer changes.",
  "overview": "Reviews PR evidence for privacy-impact changes and creates a concise mitigation checklist.",
  "mvp": "A web app that flags PII paths, retention questions, log exposure, and external sharing risks.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "GitHub Actions",
    "Cloud Logging"
  ],
  "focusAreas": [
    "PII detection",
    "log exposure",
    "retention review"
  ],
  "metrics": [
    "PII surface",
    "Logging risk",
    "Review readiness"
  ],
  "positive": "CLEAR",
  "caution": "REVIEW",
  "negative": "BLOCK PRIVACY",
  "accent": "#0e7490",
  "secondary": "#b45309",
  "sampleTarget": "https://github.com/example/crm/pull/92",
  "sampleContext": "The PR adds customer success notes and exports support metadata to analytics.",
  "sampleSignals": "Diff: new fields customer_email, freeform_note, account_health. Logs: debug statement includes customer payload. Destination: analytics topic support-events. Retention doc: not updated. Tests: schema test added."
} as const;

export type ProjectConfig = typeof project;
