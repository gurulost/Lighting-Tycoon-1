# Operations

This document captures operational notes for running the server in production.

## Runtime

- Node.js 22 LTS
- Express server bound to `0.0.0.0` on `PORT` (default 5000)

## Logs

- Request logging is enabled for `/api` routes.
- Errors are logged to stdout with stack traces.
- Recommended: add structured JSON logs and a request ID for tracing.

## CORS

- Allowed origins are derived from `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS`.
- Localhost origins are allowed for development.

## Health Checks

Use `GET /api/healthz` for hosted process liveness. It returns
`200 { "status": "ok" }` with `Cache-Control: no-store`, without requiring
database connectivity. `HEAD` returns the same status/headers without a body.

`/healthz` remains supported by the application, but the current Replit edge
returns its own 404 for that bare path before Express. `/healthz/` works, but
external monitoring should use `/api/healthz` rather than a slash workaround.

Verify the public deployment after publishing:

```bash
node scripts/verify-deployment.mjs https://lightingtycoon.replit.app
```

The check requires real 200 JSON liveness and all disabled cloud-save methods
to return 410. Redirects, cacheable health responses, HTML login/error pages,
network timeouts and accidentally enabled save routes fail the check. It never
creates or updates game progress.

## Progress Storage

Game progress is local to the device. `/api/game` is disabled with `410 Gone`;
the server does not contain an authoritative copy to back up or restore.

## Monitoring and Alerts (Recommended)

- **Metrics**: request rate, latency (p95/p99), and error rate.
- **App**: memory usage, event loop lag, unhandled rejections.
- **Alerts**: 5xx spikes, sustained latency, and static-host availability failures.

## Incident Response

- Check server logs for API errors and validation issues.
- Verify `/api/healthz`, platform manifests and their referenced static assets.
