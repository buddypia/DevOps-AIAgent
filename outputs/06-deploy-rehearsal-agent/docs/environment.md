# Environment Setup: Deploy Rehearsal Agent

## Required

- Node.js 22 or newer
- npm 10 or newer
- Gemini API key in `GEMINI_API_KEY`

## Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes for live AI | empty | Google Gemini API key. |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Gemini Flash 3.1 model ID. Override when your Google project exposes a different 3.1 Flash ID. |
| `PORT` | No | `8080` | HTTP port. Cloud Run injects this for services. |

## Google Cloud Notes

- Deploy as a Cloud Run service.
- The server listens on `0.0.0.0` and reads `PORT`, matching the Cloud Run container contract.
- Store `GEMINI_API_KEY` in Secret Manager for production deployment.

## Project-Specific Inputs

- Target: release/v2.7.0 deploy rehearsal
- Focus: env readiness, command sequencing, stop conditions
- Decisions: READY / REHEARSE / NOT READY


## Production Hardening Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SERVICE_VERSION` | No | `K_REVISION` or `local` | Version string returned by `/api/version` and logs. |
| `CORS_ORIGIN` | No | `*` | Comma-separated allowed origins. Set the deployed frontend origin in production. |
| `JSON_BODY_LIMIT` | No | `1mb` | Maximum JSON request body size for API endpoints. |
| `GITHUB_TOKEN` | Only for GitHub collection | empty | Optional GitHub token for higher API rate limits and private PR access when supported by the project. |
