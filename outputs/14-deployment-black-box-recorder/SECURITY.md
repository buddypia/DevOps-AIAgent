# Security Policy

## Supported Version

This MVP supports the current main branch only.

## Reporting A Vulnerability

Do not open public issues for exploitable vulnerabilities or leaked secrets. Send a private report to the repository maintainer with:

- affected endpoint or workflow
- reproduction steps
- expected impact
- suggested remediation, if known

## Production Secrets

- Never commit `.env`, `GEMINI_API_KEY`, `API_AUTH_TOKEN`, GitHub tokens, or Cloud credentials.
- Store production secrets in Google Secret Manager or the hosting platform's secret store.
- Rotate `API_AUTH_TOKEN` after demos, shared test runs, or suspected exposure.
