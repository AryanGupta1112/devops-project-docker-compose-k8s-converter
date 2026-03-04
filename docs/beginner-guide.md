# Beginner Guide: Full Explanation of This Project

## 1) Project Goal in One Line
This project is a translator:
- you give Docker Compose YAML
- it generates Kubernetes YAML
- it also tells you warnings where conversion is not exact

## 2) Big Story (Docker -> Compose -> Kubernetes)
Docker is the base engine that runs containers.  
Docker Compose uses Docker to run many containers together on one machine from one YAML file.  
Kubernetes is a larger orchestration system that runs containers across a cluster and keeps them healthy, scalable, and routable.

This project helps beginners move from Compose style to Kubernetes style.

## 3) The Compose Test Case Code (Input Side)
This is a simple test input you can paste in the app:

```yaml
version: "3.9"                # Compose file version
services:                     # all app services
  web:                        # service name
    image: nginx:1.27         # container image
    ports:
      - "8080:80"             # host:container
    environment:
      APP_ENV: dev            # normal env -> ConfigMap
      API_TOKEN: super-secret # sensitive env -> Secret
    depends_on:
      - redis                 # startup order hint in Compose
    volumes:
      - webdata:/usr/share/nginx/html  # named volume
      - ./cache:/cache                 # bind mount
  redis:
    image: redis:7
    ports:
      - "6379:6379"
volumes:
  webdata: {}                 # declared named volume
```

### Meaning of this Compose file
- `web` and `redis` are two containers
- `web` uses `nginx`, `redis` uses Redis image
- ports map container ports to host ports
- environment contains app settings
- volume `webdata` is persistent named volume
- `./cache` is a local folder bind mount

## 4) Kubernetes Code You Get (Output Side)
From that input, converter creates files like:
- `web-deployment.yaml`
- `web-service.yaml`
- `web-configmap.yaml`
- `web-secret.yaml`
- `web-webdata-pvc.yaml`
- similar files for `redis` (except maybe ConfigMap/Secret/PVC if not needed)

### A) Deployment example (what it means)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
  labels:
    app: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
```
Meaning:
- Deployment tells Kubernetes to keep 1 running copy of this app
- if Pod dies, Kubernetes recreates it

### B) Service example
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
```
Meaning:
- Service gives stable network identity to Pods selected by label `app: web`
- traffic to service is sent to matching Pods

### C) ConfigMap example
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-config
data:
  APP_ENV: dev
```
Meaning:
- non-secret env values are stored separately from container image

### D) Secret example
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: web-secret
type: Opaque
stringData:
  API_TOKEN: super-secret
```
Meaning:
- sensitive env values are stored in Secret resource

### E) PVC example
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: web-webdata-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```
Meaning:
- app asks cluster storage for persistent data volume

## 5) What Warnings Mean During Conversion
Typical warnings you see:
- host port ignored in Kubernetes service mapping
- `depends_on` not guaranteed in Kubernetes startup behavior
- compose networks ignored
- bind mount mapped to `emptyDir`

These warnings are important because Compose and Kubernetes are not 1-to-1.

## 6) How Kubernetes Is Operated (Start to Finish)
## 6.1 Prerequisites
- Docker Desktop with Kubernetes enabled, or Minikube/Kind
- `kubectl` installed

## 6.2 Cluster basic checks
```bash
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

## 6.3 Build converter images
```bash
docker build -f infrastructure/docker/backend.Dockerfile -t converter-backend:latest .
docker build -f infrastructure/docker/frontend.Dockerfile -t converter-frontend:latest .
```

## 6.4 Deploy converter app
```bash
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/service.yaml
```

## 6.5 Verify runtime
```bash
kubectl get pods,svc,deploy
kubectl describe deploy converter-backend
kubectl logs deployment/converter-backend
kubectl logs deployment/converter-gateway
```

## 6.6 Access app
If using local cluster, port-forward gateway service:
```bash
kubectl port-forward svc/converter-gateway-service 8080:8080
```
Then open:
- `http://localhost:8080`
- `http://localhost:8080/api/health`

## 6.7 Day-2 operations
Scale:
```bash
kubectl scale deployment/converter-backend --replicas=2
```
Restart rollout:
```bash
kubectl rollout restart deployment/converter-backend
```
Undo rollout:
```bash
kubectl rollout undo deployment/converter-backend
```
Delete app:
```bash
kubectl delete -f infrastructure/kubernetes/service.yaml
kubectl delete -f infrastructure/kubernetes/deployment.yaml
kubectl delete -f infrastructure/kubernetes/configmap.yaml
```

## 7) Meaning of Kubernetes YAML Files in This Repo
Files under `infrastructure/kubernetes/`:

1. `configmap.yaml`
- `converter-backend-config`: env vars for backend
- `converter-gateway-nginx`: full Nginx config for gateway

2. `deployment.yaml`
- `converter-backend`: runs backend API container
- `converter-frontend`: runs frontend static files container
- `converter-gateway`: runs Nginx reverse proxy container
- includes readiness/liveness probes

3. `service.yaml`
- `converter-backend-service`: internal ClusterIP for backend:3000
- `converter-frontend-service`: internal ClusterIP for frontend:80
- `converter-gateway-service`: internal ClusterIP for gateway:8080

## 8) Full Nginx Role in This Project
Nginx is used in two places:

1. Frontend container image base (`nginx:alpine`)
- serves built React static files (`index.html`, JS, CSS)

2. Gateway service (`nginx:1.27-alpine`)
- acts as reverse proxy
- routes `/` to frontend service
- routes `/api` and `/api/*` to backend service
- gives one entrypoint port for users

Gateway config file:
- `infrastructure/docker/nginx/default.conf`

Important routing behavior:
- Browser opens one URL only (for example `localhost:8081`)
- Gateway decides where to forward each request

## 9) Docker Compose Services: Backend, Frontend, Gateway
From `docker-compose.yml`:

### Backend service
- built from `infrastructure/docker/backend.Dockerfile`
- internal port `3000`
- environment variables for API behavior
- not directly exposed to host (only `expose`)

### Frontend service
- built from `infrastructure/docker/frontend.Dockerfile`
- internal port `80`
- serves React static app

### Gateway service
- runs `nginx:1.27-alpine`
- `depends_on`: backend + frontend
- maps host port `${HOST_PORT:-8080}` to container `8080`
- mounts custom nginx config

## 10) Backend: Everything Related to It
Main backend files:
- `src/main/backend/src/server.ts`: starts Express server on configured port
- `src/main/backend/src/app.ts`: routes, middleware, upload handling, conversion API, download API
- `src/main/backend/src/services/composeConverter.ts`: conversion engine
- `src/main/backend/src/services/zipService.ts`: builds zip buffer from generated manifests
- `src/main/backend/src/utils/jobStore.ts`: in-memory temporary storage for conversion jobs (`jobId`)
- `src/main/backend/src/utils/logger.ts`: structured JSON logs using pino
- `src/main/backend/src/utils/metrics.ts`: Prometheus metrics objects

Backend request flow:
1. frontend sends YAML to `/api/convert`
2. backend validates and parses YAML
3. converter builds manifest strings + warnings
4. backend returns JSON + `jobId`
5. frontend calls `/api/download?jobId=...`
6. backend returns ZIP

Key backend endpoints:
- `GET /api/health`
- `GET /api/metrics`
- `POST /api/convert`
- `GET /api/download`
- `POST /api/download`

## 11) Frontend: Files and Components Used
Frontend stack:
- React + TypeScript + Vite
- Material UI (MUI)
- Monaco Editor
- React Router

Main files:
- `src/main/frontend/src/main.tsx`: app bootstrap, router, theme provider
- `src/main/frontend/src/App.tsx`: top layout, app bar, route switching
- `src/main/frontend/src/pages/ConverterPage.tsx`: main converter screen
- `src/main/frontend/src/pages/AboutPage.tsx`: project explanation page
- `src/main/frontend/src/components/ServiceSummaryTable.tsx`: parsed services table
- `src/main/frontend/src/components/ManifestTabs.tsx`: generated manifest tab viewer
- `src/main/frontend/src/theme.ts`: MUI theme config
- `src/main/frontend/src/types.ts`: response type contracts

What each component does:
- `ConverterPage`: upload/paste YAML, call API, show results, trigger ZIP download
- `ServiceSummaryTable`: shows service name/image/ports/secret/configmap/volume counts
- `ManifestTabs`: shows each generated YAML file in tabs
- `AboutPage`: short description and doc links

## 12) Why You See This Backend Log Sometimes
Log:
`Static frontend directory not found; API-only mode is active.`

Meaning:
- backend container could not find local static frontend files in its own filesystem
- in split-service architecture this can still be okay because frontend is served by separate frontend container and gateway routes traffic correctly

## 13) Understanding Your HOST_PORT=8081 Console Output
When you run:

```cmd
set "HOST_PORT=8081" && docker-compose up --build
```

What output means:
- build success + many `CACHED` lines = fast rebuild
- containers recreated successfully
- frontend nginx started normally
- gateway nginx started normally
- backend started on internal `3000`
- public entrypoint becomes `http://localhost:8081` via gateway

## 14) Quick Commands Cheat Sheet
Start app:
```bash
docker-compose up --build
```
Use different port (Windows CMD):
```cmd
set "HOST_PORT=8081" && docker-compose up --build
```
Check running containers:
```bash
docker compose ps
```
See logs:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f gateway
```
Health check:
```bash
curl http://localhost:8081/api/health
```

## 15) CI/CD Status for This Project
Right now, GitHub workflow automation is intentionally removed.

Why:
- your selected category is Docker & Kubernetes
- current submission focus is app behavior + Docker runtime + Kubernetes conversion
- CI/CD can be added later without changing core converter logic

So at this time:
- no active file under `.github/workflows/`
- local run and testing are done manually using Docker/NPM commands

## 21) API Endpoints (What Exactly Goes In/Out)
Base URL (through gateway):
- `http://localhost:8080/api` (or `8081` if you changed host port)

Endpoints:
1. `GET /api/health`
- purpose: quick health check
- response: `{ "status": "ok", "timestamp": "..." }`

2. `GET /api/metrics`
- purpose: Prometheus metrics output
- response: plain text metrics format

3. `POST /api/convert`
- purpose: convert Compose YAML to Kubernetes manifests
- input option A: JSON `{ "composeYaml": "..." }`
- input option B: multipart file field `composeFile`
- output: `{ jobId, manifests, warnings, services }`

4. `GET /api/download?jobId=<id>`
- purpose: download ZIP for a previous conversion

5. `POST /api/download`
- purpose: create ZIP directly from a `manifests` object in request body

## 22) Environment Variables You Should Know
From `.env` / `.env.example`:
- `PORT`: backend server internal listening port
- `HOST_PORT`: host machine port for gateway mapping (`8080` default)
- `LOG_LEVEL`: backend log level (`info`, `debug`, etc.)
- `UPLOAD_LIMIT_MB`: max upload size for compose file
- `JOB_TTL_MINUTES`: how long conversion jobs stay in memory for ZIP download

Practical meaning:
- if `HOST_PORT` changes, your browser/API URL host port changes
- if `JOB_TTL_MINUTES` is small, old `jobId` download may fail with not found

## 23) Error Handling Behavior (Important for Demo)
Common cases:
- empty input -> 400 error
- invalid YAML syntax -> 400 error
- missing `services:` in YAML -> 400 error
- unknown/complex mappings -> warning list (not always hard error)
- expired or bad `jobId` on download -> 404 error

Why this matters:
- app is designed to fail clearly with message, not silently

## 24) Security Basics Present in This Project
- upload size limit via multer config
- in-memory upload handling (no untrusted file path writes)
- sensitive env heuristic moved to Secret resource

Note:
- no authentication/authorization layer (out of scope here)

## 25) Logging and Observability Basics
- backend uses structured JSON logs (`pino`)
- health endpoint: `/api/health`
- metrics endpoint: `/api/metrics`
- request count and conversion latency metrics are exported

Even with monitoring placeholders in repo, app endpoints are still useful for runtime checks.

## 26) Known Limitations (What to Say Clearly)
- Not full Compose feature parity
- `depends_on` behavior differs in Kubernetes
- complex networks are not converted
- bind mounts are simplified to `emptyDir`
- advanced healthcheck mapping is limited
- generated manifests are learning-friendly baseline, may need manual tuning

## 27) Common Commands for Daily Use
Start:
```bash
docker-compose up --build
```
Stop and remove containers:
```bash
docker-compose down
```
Rebuild from scratch:
```bash
docker-compose build --no-cache
docker-compose up
```
Check logs:
```bash
docker compose logs -f gateway
docker compose logs -f backend
docker compose logs -f frontend
```

## 28) Typical Demo Flow (5-7 Minutes)
1. explain problem (Compose vs K8s gap)
2. start stack and open UI
3. paste sample compose and convert
4. show summary + warnings + generated YAML tabs
5. download ZIP and show files
6. show `/api/health`
7. mention that CI workflow is intentionally out of current scope
8. mention limitations honestly

## 29) Quick Glossary (Beginner Friendly)
- Container: packaged app process
- Image: blueprint used to create container
- Compose: multi-container local orchestration
- Pod: smallest Kubernetes runtime unit (1+ containers)
- Deployment: keeps desired number of Pods running
- Service: stable network endpoint for Pods
- ConfigMap: non-secret configuration data
- Secret: sensitive configuration data
- PVC: storage request in Kubernetes
- Ingress/Proxy: traffic router to services

## 30) Final Practical Advice
- Use this converter output as a strong starting point, not final production truth.
- Always read warnings and review generated YAML before real deployment.
- Keep changes small, test often, and let CI checks run on every push.
