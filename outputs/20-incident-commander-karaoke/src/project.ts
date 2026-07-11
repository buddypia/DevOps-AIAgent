export const project = {
  "rank": 20,
  "ideaNo": "424",
  "name": "Incident Commander Karaoke",
  "slug": "20-incident-commander-karaoke",
  "packageName": "incident-commander-karaoke",
  "role": "incident command rehearsal coach",
  "tagline": "Scores spoken incident commands for clarity and operational fit.",
  "overview": "Evaluates incident commander instructions from transcript-like input and returns coaching feedback.",
  "mvp": "A rehearsal console that scores a command transcript, identifies missing facts, and drafts a better command.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Speech-to-Text"
  ],
  "focusAreas": [
    "command clarity",
    "role assignment",
    "communication cadence"
  ],
  "metrics": [
    "Clarity",
    "Actionability",
    "Cadence"
  ],
  "positive": "GOOD COMMAND",
  "caution": "COACH",
  "negative": "RETRY COMMAND",
  "accent": "#9333ea",
  "secondary": "#f97316",
  "sampleTarget": "incident commander transcript",
  "sampleContext": "A practice incident bridge is running. The commander reads a short instruction and wants scoring.",
  "sampleSignals": "Transcript: 'Everyone look at logs and tell me if it is bad. Maybe roll back if needed. Someone update support.' Missing: named owners, time box, user impact, rollback criteria, next update time. Situation: checkout 5xx at 4.8%."
} as const;

export type ProjectConfig = typeof project;
