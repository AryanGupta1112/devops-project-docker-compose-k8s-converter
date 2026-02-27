# Deployment Guide

## 1. Local Docker Compose Deployment
Run from project root:

```bash
docker-compose up --build
```

Default endpoints:
- UI: `http://localhost:8080`
- API: `http://localhost:8080/api`

If port `8080` is occupied:
```bash
# Windows CMD
set HOST_PORT=8081 && docker-compose up --build
```

## 2. Docker Services
- `frontend` -> static React application
- `backend` -> Express API (internal port `3000`)
- `gateway` -> Nginx entrypoint (external port `8080`)

## 3. Kubernetes Deployment
Build images:
```bash
docker build -f infrastructure/docker/backend.Dockerfile -t converter-backend:latest .
docker build -f infrastructure/docker/frontend.Dockerfile -t converter-frontend:latest .
```

Apply manifests:
```bash
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/service.yaml
```

Verify:
```bash
kubectl get pods,svc,deploy
```

## 4. Rollback (Basic)
- Compose: `docker-compose down` then rerun previous stable image tags.
- Kubernetes: `kubectl rollout undo deployment/<deployment-name>`.
