export const project = {
  "rank": 17,
  "ideaNo": "179",
  "name": "Decision Fatigue Reducer",
  "slug": "17-decision-fatigue-reducer",
  "packageName": "decision-fatigue-reducer",
  "role": "decision prioritization agent",
  "tagline": "Chooses the three decisions humans should make now.",
  "overview": "Reads crowded PR and issue context to rank the decisions that unblock delivery.",
  "mvp": "A decision queue that groups noisy work into now, later, and delegate recommendations.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "GitHub Actions"
  ],
  "focusAreas": [
    "decision ranking",
    "delegation",
    "unblock sequence"
  ],
  "metrics": [
    "Decision pressure",
    "Unblock value",
    "Delegation fit"
  ],
  "positive": "DECIDE THREE",
  "caution": "DEFER",
  "negative": "ESCALATE",
  "accent": "#854d0e",
  "secondary": "#0284c7",
  "sampleTarget": "sprint release queue",
  "sampleContext": "Team has 18 open PRs, 9 release questions, and two hours before branch freeze.",
  "sampleSignals": "PRs: billing copy, retry policy, mobile deep link, analytics schema. CI failures on retry policy. Product question about beta scope. Security question about logging customer email. Two reviewers overloaded."
} as const;

export type ProjectConfig = typeof project;
