# Architecture Notes

## Runtime Architecture (Docker Compose)

```mermaid
flowchart LR
  User --> Gateway[Nginx Gateway :8080]
  Gateway --> Frontend[Frontend Service :80]
  Gateway --> Backend[Backend Service :3000]
  Backend --> Converter[Compose Converter Engine]
```

## Request Flow
1. User submits Compose YAML in frontend.
2. Frontend calls `POST /api/convert` through gateway.
3. Backend parses YAML, generates manifests, warnings, and job ID.
4. Frontend displays manifests and allows ZIP download.

## Observability Flow
- Gateway routes `/api/metrics` to backend.
- Prometheus scrapes gateway endpoint for metrics.
