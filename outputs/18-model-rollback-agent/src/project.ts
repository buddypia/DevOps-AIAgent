export const project = {
  "rank": 18,
  "ideaNo": "209",
  "name": "Model Rollback Agent",
  "slug": "18-model-rollback-agent",
  "packageName": "model-rollback-agent",
  "role": "AI model rollback judge",
  "tagline": "Decides when a model or prompt change should be rolled back.",
  "overview": "Compares model evaluation, production feedback, and logs to judge rollback for AI features.",
  "mvp": "A model operations board that recommends keep, canary, or rollback with evidence.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "Cloud Monitoring"
  ],
  "focusAreas": [
    "model comparison",
    "eval regression",
    "production feedback"
  ],
  "metrics": [
    "Model health",
    "Eval regression",
    "User correction rate"
  ],
  "positive": "KEEP MODEL",
  "caution": "CANARY",
  "negative": "ROLLBACK MODEL",
  "accent": "#2563eb",
  "secondary": "#c026d3",
  "sampleTarget": "support-agent model update",
  "sampleContext": "Support agent moved from previous model to Gemini Flash 3.1 variant. Team needs rollback decision after one hour.",
  "sampleSignals": "Eval pass rate 93% -> 90%, tool-call success 96% -> 91%, Japanese answers improved, refund hallucination reports increased from 1 to 7. Latency down 24%. Human override rate up 3.5 points."
} as const;

export type ProjectConfig = typeof project;
