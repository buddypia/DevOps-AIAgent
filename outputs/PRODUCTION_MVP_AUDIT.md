# Production MVP Audit

Date: 2026-05-14

## Objective

Re-evaluate all 20 projects and bring them to a production-level state that can credibly be claimed as MVPs.

## Prompt-To-Artifact Checklist

| Requirement | Evidence |
| --- | --- |
| Re-evaluate all 20 projects | `outputs/PRODUCTION_MVP_EVALUATION.md` contains a 20-row evaluation table. |
| Make them credible MVPs | Each app has scenarios, decision modes, history, copy/export, structured AI output, fallback, and README MVP guarantees. |
| Bring to production-level state | Each app has security headers, request IDs, structured logging, unified error JSON, health/readiness/version endpoints, and production Dockerfile. |
| Preserve all 20 independent projects | `outputs/01-*` through `outputs/20-*` remain independent with their own package, source, docs, tests, Dockerfile, and build artifacts. |
| Verify with real gates | `npm run verify` is run for every project: typecheck, Vitest, client build, server build. |
| Avoid relying on proxy signals only | Additional checks inspect files for production markers and smoke-test a representative app over HTTP. |

## Required Verification

```bash
for d in outputs/[0-9][0-9]-*; do
  (cd "$d" && npm run verify) || exit 1
done
```

Expected result: all 20 pass.

```bash
node -e 'const fs=require("fs"); const dirs=fs.readdirSync("outputs").filter(x=>/^\\d{2}-/.test(x)); const markers=["/api/ready","/api/version","X-Request-Id","Content-Security-Policy","createApp","startServer"]; const bad=[]; for (const d of dirs){ const server=fs.readFileSync("outputs/"+d+"/src/server.ts","utf8"); for (const marker of markers) if(!server.includes(marker)) bad.push(d+" missing "+marker); } console.log(bad.length?bad.join("\\n"):"all projects include production server markers");'
find outputs -path '*/dist/client/index.html' | wc -l
find outputs -path '*/dist/server/server.js' | wc -l
```

Expected result: all projects include markers, 20 client builds, 20 server builds.

## Latest Verification Result

Ran on 2026-05-14 JST after the production hardening pass.

| Gate | Result |
| --- | --- |
| All project `npm run verify` | Pass: 20/20 projects |
| Vitest contract/unit coverage | Pass: 104 tests total; ShipGuard AI has 9 tests, the other 19 projects have 5 tests each |
| Client build artifacts | Pass: 20 `dist/client/index.html` files |
| Server build artifacts | Pass: 20 `dist/server/server.js` files |
| Production server markers | Pass: 20/20 include health, readiness, version, request ID, CSP, `createApp`, and `startServer` |
| SPA/API boundary markers | Pass: 20/20 serve static UI while preserving JSON 404s for unknown `/api/*` routes |
| Representative production smoke | Pass: `outputs/01-shipguard-ai` served `HEAD /` and `GET /` with 200, `/api/ready` with 200, and `/api/does-not-exist` with JSON 404 on `PORT=18101` |

The representative production server was shut down cleanly after the smoke check.
