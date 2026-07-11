export const project = {
  "rank": 10,
  "ideaNo": "123",
  "name": "Cloud Run Traffic Mixer",
  "slug": "10-cloud-run-traffic-mixer",
  "packageName": "cloud-run-traffic-mixer",
  "role": "traffic split planning agent",
  "tagline": "Plans staged Cloud Run revision traffic shifts from live signals.",
  "overview": "Uses revision evidence and operational signals to recommend the next Cloud Run traffic allocation.",
  "mvp": "A traffic mixer that proposes 10/25/50/100 percent stages, waits, and rollback conditions.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "Cloud Monitoring"
  ],
  "focusAreas": [
    "traffic stages",
    "wait conditions",
    "revision health"
  ],
  "metrics": [
    "New revision health",
    "Shift appetite",
    "Rollback safety"
  ],
  "positive": "SHIFT UP",
  "caution": "HOLD SPLIT",
  "negative": "SHIFT DOWN",
  "accent": "#4338ca",
  "secondary": "#ea580c",
  "sampleTarget": "checkout-api traffic split",
  "sampleContext": "New revision receives 25% traffic. Team wants an autonomous recommendation for the next split.",
  "sampleSignals": "Revision stable at 25% for 20 minutes. New revision 5xx 0.42%, old 0.31%. p95 +20ms. Business conversion unchanged. New log pattern appears only when feature flag retry_v2 is on. Rollback command tested."
} as const;

export type ProjectConfig = typeof project;
