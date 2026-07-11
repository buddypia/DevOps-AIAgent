# Contributing

## Local Verification

```bash
npm ci
npm run verify
npm audit --audit-level=high
```

## Pull Request Checklist

- Update tests for changed API, agent, or UI behavior.
- Keep `.env.example`, README, and docs in sync with new configuration.
- Do not commit generated `node_modules`, local `.env`, credentials, or screenshots containing secrets.
- Explain any production-risk tradeoff in the PR description.
