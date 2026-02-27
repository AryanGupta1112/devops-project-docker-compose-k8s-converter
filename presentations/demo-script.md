# Demo Script

## 1. Intro (30s)
- Introduce project goal: convert Docker Compose to Kubernetes manifests.
- Mention target users: students and junior DevOps engineers.

## 2. Show UI (1 min)
- Open `http://localhost:8080`
- Paste/upload `docker-compose.yml`
- Click **Convert**

## 3. Explain Output (1 min)
- Service summary table
- Warning panel (unsupported or best-effort mappings)
- Manifest tabs (Deployment/Service/ConfigMap/Secret/PVC)

## 4. Download (30s)
- Click **Download ZIP**
- Show generated files on local machine

## 5. Operational Readiness (1 min)
- Show `/api/health`
- Show `/api/metrics`
- Mention `frontend + backend + gateway` Docker Compose services
- Mention CI/CD pipeline and Trivy scans on backend/frontend images

## 6. Limitations + Next Steps (30s)
- Advanced Compose features need manual tuning
- Future: readiness/liveness conversion from healthcheck, Helm output
