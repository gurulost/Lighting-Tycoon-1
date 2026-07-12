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

Use `GET /healthz` for process liveness. It returns `200 { "status": "ok" }`
without requiring database connectivity.

## Progress Storage

Game progress is local to the device. `/api/game` is disabled with `410 Gone`;
the server does not contain an authoritative copy to back up or restore.

## Monitoring and Alerts (Recommended)

- **Metrics**: request rate, latency (p95/p99), and error rate.
- **App**: memory usage, event loop lag, unhandled rejections.
- **Alerts**: 5xx spikes, sustained latency, and static-host availability failures.

## Incident Response

- Check server logs for API errors and validation issues.
- Verify `/healthz` and static asset responses.
