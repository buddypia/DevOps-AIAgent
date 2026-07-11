export const project = {
  "rank": 14,
  "ideaNo": "150",
  "name": "Deployment Black Box Recorder",
  "slug": "14-deployment-black-box-recorder",
  "packageName": "deployment-black-box-recorder",
  "role": "deployment evidence recorder",
  "tagline": "Captures the facts that matter at deploy time.",
  "overview": "Builds a searchable record of PRs, CI, config, AI judgment, and logs for later incident learning.",
  "mvp": "A deploy recorder that summarizes the deployment envelope and highlights evidence worth preserving.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "GitHub Actions"
  ],
  "focusAreas": [
    "evidence capture",
    "timeline anchors",
    "incident replay"
  ],
  "metrics": [
    "Record completeness",
    "Replay value",
    "Config coverage"
  ],
  "positive": "RECORD",
  "caution": "ENRICH RECORD",
  "negative": "MISSING EVIDENCE",
  "accent": "#334155",
  "secondary": "#0d9488",
  "sampleTarget": "deploy record checkout-api 00153",
  "sampleContext": "Team wants every deployment to leave a forensic capsule for postmortem and release review.",
  "sampleSignals": "Captured: PR 184, CI run 7721, image digest sha256:abc, env diff with RETRY_LIMIT 2->4, traffic split 10->100, release owner, AI gate verdict WATCH. Missing: final 15-minute log snapshot and feature flag state."
} as const;

export type ProjectConfig = typeof project;
