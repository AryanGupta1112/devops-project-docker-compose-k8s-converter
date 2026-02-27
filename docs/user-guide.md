# User Guide

## 1. What This Tool Does
This tool converts a Docker Compose file into Kubernetes YAML manifests and shows warnings for anything that cannot be converted exactly.

## 2. Start the App
1. Ensure Docker Desktop is running.
2. From project root, run:
   ```bash
   docker-compose up --build
   ```
3. Open:
   - UI: `http://localhost:8080`
   - API: `http://localhost:8080/api`

If port `8080` is occupied:
```bash
# Windows CMD
set HOST_PORT=8081 && docker-compose up --build
```
Then open `http://localhost:8081`.

Compose runtime services:
- `gateway` (Nginx reverse proxy)
- `frontend` (React static app)
- `backend` (Express API)

## 3. Convert a Compose File
1. On the Converter page, upload `docker-compose.yml` or paste YAML in Monaco editor.
2. Click **Convert**.
3. Review:
   - Parsed service summary
   - Warnings
   - Generated manifests in tabs
4. Click **Download ZIP** to save all output manifests.

## 4. Understanding Warnings
Common warnings include:
- Host port ignored
- `depends_on` behavior differs in Kubernetes
- Compose network settings ignored
- Build context replaced by placeholder image

Warnings help you manually fine-tune manifests before production use.

## 5. Monitoring
- Health: `GET /api/health`
- Metrics: `GET /api/metrics`
- Prometheus sample config: `monitoring/prometheus/prometheus.yml`
- Alert rules: `monitoring/alerts/rules.yml`

## 6. Screenshots
Add screenshots under `docs/screenshots/`:
- Home page with YAML editor
- Converted output with warnings
- Download ZIP action
