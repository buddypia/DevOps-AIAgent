export const project = {
  "rank": 19,
  "ideaNo": "401",
  "name": "Chaos Drill Agent",
  "slug": "19-chaos-drill-agent",
  "packageName": "chaos-drill-agent",
  "role": "chaos exercise conductor",
  "tagline": "Designs a safe drill and scores detection, judgment, and recovery.",
  "overview": "Creates controlled failure drills, expected signals, scoring rubrics, and recovery evaluation.",
  "mvp": "A chaos drill planner that outputs scenario, guardrails, scoring, and post-drill improvements.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "ADK"
  ],
  "focusAreas": [
    "failure injection",
    "safety guardrails",
    "response scoring"
  ],
  "metrics": [
    "Drill safety",
    "Detection quality",
    "Recovery score"
  ],
  "positive": "RUN DRILL",
  "caution": "TIGHTEN GUARDRAILS",
  "negative": "DO NOT RUN",
  "accent": "#991b1b",
  "secondary": "#0f766e",
  "sampleTarget": "checkout timeout chaos drill",
  "sampleContext": "Team wants a 10-minute staging drill that simulates payment provider latency without affecting production.",
  "sampleSignals": "Staging only. Proposed injection: add 900ms latency to payment sandbox for 20% requests. Monitors: checkout p95, retry warnings, synthetic checkout. Guardrails: stop at 2% 5xx or p95 > 2s. Runbook owner available."
} as const;

export type ProjectConfig = typeof project;
