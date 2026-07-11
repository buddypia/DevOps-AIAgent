export const project = {
  "rank": 9,
  "ideaNo": "051",
  "name": "Eval Dataset Gardener",
  "slug": "09-eval-dataset-gardener",
  "packageName": "eval-dataset-gardener",
  "role": "AI eval maintenance agent",
  "tagline": "Turns failures and low-rated responses into eval cases.",
  "overview": "Harvests failed AI responses and operational feedback into structured evaluation cases for regression gates.",
  "mvp": "A dataset workbench that suggests eval cases, expected behavior, and a regression run plan.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "BigQuery"
  ],
  "focusAreas": [
    "failure harvesting",
    "expected answer drafting",
    "regression grouping"
  ],
  "metrics": [
    "Eval value",
    "Coverage gain",
    "Regression risk"
  ],
  "positive": "ADD CASES",
  "caution": "CURATE",
  "negative": "BLOCK MODEL CHANGE",
  "accent": "#a16207",
  "secondary": "#2563eb",
  "sampleTarget": "support-agent eval refresh",
  "sampleContext": "AI support agent had low-rated answers after a prompt update. Team needs new regression cases before the next release.",
  "sampleSignals": "Failed responses: refund policy hallucinated for enterprise plan, ignored Japanese locale, tool timeout turned into confident answer. User ratings: 12 thumbs down. Current eval suite lacks locale and tool-failure cases."
} as const;

export type ProjectConfig = typeof project;
