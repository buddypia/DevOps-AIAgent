# Production Runbook: Privacy Impact Diff Agent

## Service

- Package: `privacy-impact-diff-agent`
- Primary protected endpoint: `POST /api/analyze`
- Health endpoint: `GET /api/health`
- Readiness endpoint: `GET /api/ready`

## Required Production Controls

- Set `NODE_ENV=production`.
- Set `API_AUTH_TOKEN` and keep `REQUIRE_API_AUTH=true` unless the service is behind Cloud Run IAM, IAP, or an API Gateway.
- Set `GEMINI_API_KEY` through Secret Manager.
- Set `CORS_ORIGIN` to the deployed frontend origin.
- Keep `RATE_LIMIT_MAX_REQUESTS` conservative until real usage data exists.

## Incident Response

1. Check `/api/ready` and confirm `authConfigured`, `geminiConfigured`, and `clientReady`.
2. Search logs by `requestId` from the failed API response.
3. If Gemini calls fail, confirm fallback responses are acceptable for the current incident.
4. If rate limits fire, inspect traffic source and raise or block deliberately.
5. Rotate `API_AUTH_TOKEN` after suspected exposure.

## Rollback

Use Cloud Run revision rollback to return traffic to the last known healthy revision. Keep the previous revision available until smoke tests and logs are clean.
