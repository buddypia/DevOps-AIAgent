export const project = {
  "rank": 15,
  "ideaNo": "011",
  "name": "Dark Launch Scout",
  "slug": "15-dark-launch-scout",
  "packageName": "dark-launch-scout",
  "role": "dark launch readiness scout",
  "tagline": "Reads hidden-feature signals before public launch.",
  "overview": "Analyzes internal-only or flag-hidden behavior to judge whether a dark launch is ready for exposure.",
  "mvp": "A scout dashboard that scores hidden feature health and names what must be watched before launch.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "Cloud Monitoring"
  ],
  "focusAreas": [
    "hidden traffic",
    "flag readiness",
    "launch watchpoints"
  ],
  "metrics": [
    "Launch readiness",
    "Hidden error rate",
    "Signal maturity"
  ],
  "positive": "LAUNCH",
  "caution": "KEEP DARK",
  "negative": "DISABLE",
  "accent": "#155e75",
  "secondary": "#c2410c",
  "sampleTarget": "feature flag invoice_ai_assist",
  "sampleContext": "New AI invoice assistant is dark-launched to employees only. Product wants to open beta.",
  "sampleSignals": "Internal traffic 840 sessions. Error rate 1.1%, p95 620ms, Gemini timeout 0.4%. Manual feedback: useful but sometimes slow. No external users. Logging lacks request category field. Rollback is flag disable."
} as const;

export type ProjectConfig = typeof project;
