export const project = {
  "rank": 16,
  "ideaNo": "076",
  "name": "AI Exploratory Tester",
  "slug": "16-ai-exploratory-tester",
  "packageName": "ai-exploratory-tester",
  "role": "exploratory QA agent",
  "tagline": "Turns a target URL and notes into exploration charters and bug reports.",
  "overview": "Plans exploratory testing routes, identifies likely broken flows, and drafts reproducible issues.",
  "mvp": "A QA workbench that creates test charters, expected observations, and bug report skeletons.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "ADK"
  ],
  "focusAreas": [
    "exploration route",
    "bug reproduction",
    "user-flow coverage"
  ],
  "metrics": [
    "Coverage",
    "Bug likelihood",
    "Repro clarity"
  ],
  "positive": "TEST NOW",
  "caution": "EXPLORE MORE",
  "negative": "BLOCK RELEASE",
  "accent": "#6d28d9",
  "secondary": "#16a34a",
  "sampleTarget": "https://staging.example.com/signup",
  "sampleContext": "New onboarding flow includes plan selection, team invite, and billing setup. Release candidate is ready for exploratory QA.",
  "sampleSignals": "Known risk: long organization names, Japanese locale, failed card, back button from invite step. Existing e2e only covers happy path. Recent UI diff changed validation and empty states."
} as const;

export type ProjectConfig = typeof project;
