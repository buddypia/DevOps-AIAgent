export const project = {
  "rank": 6,
  "ideaNo": "003",
  "name": "Deploy Rehearsal Agent",
  "slug": "06-deploy-rehearsal-agent",
  "packageName": "deploy-rehearsal-agent",
  "role": "pre-production rehearsal director",
  "tagline": "Dry-runs deployment instructions before they become an outage.",
  "overview": "Reads README, Actions, environment variables, and release notes to catch deploy holes before production.",
  "mvp": "A rehearsal checker that produces missing prerequisites, command order, and stop conditions.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "GitHub Actions"
  ],
  "focusAreas": [
    "env readiness",
    "command sequencing",
    "stop conditions"
  ],
  "metrics": [
    "Readiness",
    "Config gap",
    "Rollback clarity"
  ],
  "positive": "READY",
  "caution": "REHEARSE",
  "negative": "NOT READY",
  "accent": "#4f46e5",
  "secondary": "#ca8a04",
  "sampleTarget": "release/v2.7.0 deploy rehearsal",
  "sampleContext": "Team wants to deploy a Cloud Run service from source after merging feature flags and DB index migration.",
  "sampleSignals": "README says set STRIPE_WEBHOOK_SECRET but .env.example lacks it. GitHub Actions deploy job uses node 20 while local package expects node 22. Cloud Run min instances set to zero. Rollback command exists but migration rollback SQL is missing."
} as const;

export type ProjectConfig = typeof project;
