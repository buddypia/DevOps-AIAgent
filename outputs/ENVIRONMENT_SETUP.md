# Shared Environment Setup

## Runtime

- Node.js: 22 or newer
- npm: 10 or newer
- Deployment target: Cloud Run service

Cloud Run requires the ingress container to listen on `0.0.0.0` and the `PORT` environment variable. All 20 apps implement that contract.

## Gemini

All apps use `@google/genai` and default to:

```bash
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=your_api_key
```

If your Google AI Studio or Vertex AI project exposes a preview or region-specific Gemini Flash 3.1 model ID, set `GEMINI_MODEL` to that ID without changing code.

The apps also accept `GOOGLE_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` for local compatibility.

## Local Workflow

```bash
cd outputs/<project-folder>
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts:

- Express API on `http://localhost:8080`
- Vite web UI on the printed Vite URL with `/api` proxied to port 8080

## Production Workflow

```bash
cd outputs/<project-folder>
npm install
npm run build
npm start
```

## Cloud Run Deployment

```bash
gcloud run deploy <service-name> \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-3.1-flash-lite
```

For production, store `GEMINI_API_KEY` in Secret Manager and attach it with `--set-secrets`.
