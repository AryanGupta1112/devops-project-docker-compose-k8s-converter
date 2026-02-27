# Troubleshooting Guide

## 1. Port 8080 Already in Use
Symptoms:
- Docker starts but gateway fails with bind error on `8080`.

Fix:
```bash
# Windows CMD
set HOST_PORT=8081 && docker-compose up --build
```

## 2. Docker Build is Slow
Symptoms:
- Build context upload takes too long.

Fix:
- Ensure `.dockerignore` is present (already configured).
- Close heavy file sync tools during build.
- Use Docker Desktop with sufficient CPU/RAM allocation.

## 3. API Returns YAML Parse Error
Symptoms:
- `/api/convert` returns 400 parse error.

Fix:
- Validate YAML indentation and syntax.
- Ensure top-level `services:` key exists.

## 4. ZIP Download Fails
Symptoms:
- Download endpoint returns 404 for `jobId`.

Fix:
- Convert again to regenerate fresh `jobId`.
- Download quickly before in-memory job TTL expires.

## 5. Metrics Not Showing in Prometheus
Symptoms:
- `up{job="converter-gateway"} = 0`.

Fix:
- Ensure gateway is running and reachable.
- Confirm target in `monitoring/prometheus/prometheus.yml`.
- Check `/api/metrics` directly in browser.

## 6. Frontend Does Not Load
Symptoms:
- Blank UI or Nginx error.

Fix:
- Rebuild compose stack: `docker-compose up --build`.
- Check frontend and gateway container logs:
  - `docker-compose logs frontend`
  - `docker-compose logs gateway`
