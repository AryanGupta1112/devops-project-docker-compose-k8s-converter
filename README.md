# Docker Compose to Kubernetes Converter

Student Name: Aryan Gupta  
Registration No: 23FE10CSE00284  
Course: CSE3253 DevOps [PE6]  
Semester: VI (2025-2026)  
Project Type: Docker & K8s  
Difficulty: Intermediate  

---

## Project Overview

### Problem Statement
Developers often use Docker Compose in local development, but deployment environments require Kubernetes manifests. Manual conversion is repetitive and error-prone.

### Objectives
- [x] Accept Docker Compose YAML through file upload or editor paste.
- [x] Convert compose services into Kubernetes manifests with best-effort mapping.
- [x] Provide warnings for unsupported or partially-supported compose features.
- [x] Export generated Kubernetes manifests as a ZIP.
- [x] Include CI/CD, tests, monitoring, and deployment documentation.

### Key Features
- Web UI with Material UI and Monaco editor.
- API-based conversion engine with validation and warning output.
- ZIP download for generated manifests.
- Unit and integration tests.
- CI/CD pipeline with lint, test, build, and Trivy scanning.

---

## Technology Stack

### Core Technologies
- Programming Language: TypeScript (Node.js + React)
- Framework: Express (backend), React + Vite (frontend)
- Database: None

### DevOps Tools
- Version Control: Git
- CI/CD: GitHub Actions (primary), Jenkins/GitLab placeholders
- Containerization: Docker
- Orchestration: Kubernetes
- Configuration Management: Puppet/Terraform placeholders
- Monitoring: Prometheus (active), Nagios placeholder

---

## Getting Started

### Prerequisites
- [x] Docker Desktop v20.10+
- [x] Git 2.30+
- [x] Node.js 20+ (for local non-Docker run)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<username>/devops-project-docker-compose-k8s-converter.git
   cd devops-project-docker-compose-k8s-converter
   ```

2. Build and run using Docker:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Web Interface: `http://localhost:8080`
   - API Base: `http://localhost:8080/api`

If port `8080` is in use:
```bash
# Windows CMD
set HOST_PORT=8081 && docker-compose up --build
```
Then use `http://localhost:8081`.

### Alternative Installation (Without Docker)
```bash
npm ci
npm --prefix src/main/frontend ci
npm run build
npm start
```

---

## Project Structure

```text
devops-project-docker-compose-k8s-converter/
├── README.md
├── .gitignore
├── LICENSE
├── src/
│   ├── main/
│   │   ├── backend/
│   │   ├── frontend/
│   │   └── config/
│   ├── test/
│   └── scripts/
├── docs/
│   ├── project-plan.md
│   ├── design-document.md
│   ├── user-guide.md
│   ├── api-documentation.md
│   ├── deployment.md
│   ├── troubleshooting.md
│   ├── architecture/
│   └── screenshots/
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   ├── puppet/
│   └── terraform/
├── pipelines/
│   ├── Jenkinsfile
│   ├── .github/workflows/ci-cd.yml
│   └── gitlab-ci.yml
├── .github/workflows/ci-cd.yml
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── selenium/
│   └── test-data/
├── monitoring/
│   ├── prometheus/
│   ├── nagios/
│   ├── alerts/
│   └── dashboards/
├── presentations/
└── deliverables/
```

---

## Configuration

### Environment Variables
Create `.env` in project root:

```env
PORT=3000
LOG_LEVEL=info
UPLOAD_LIMIT_MB=2
JOB_TTL_MINUTES=30
HOST_PORT=8080
```

### Key Configuration Files
1. `src/main/config/config.yaml` - Application configuration
2. `docker-compose.yml` - Multi-container setup
3. `infrastructure/kubernetes/` - Kubernetes deployment files

---

## CI/CD Pipeline

### Pipeline Stages
1. Code Quality Check - Backend and frontend lint
2. Test - Unit and integration tests
3. Build - Build backend and frontend Docker images
4. Security Scan - Trivy scan for both images
5. Deploy to Staging - Placeholder stage
6. Deploy to Production - Placeholder stage

### Pipeline Status
![Pipeline Status](https://img.shields.io/badge/pipeline-configured-brightgreen)

---

## Testing

### Test Types
- Unit Tests: `npm run test:unit`
- Integration Tests: `npm run test:integration`
- E2E Tests: Selenium placeholder under `tests/selenium/`

### Run All Tests
```bash
npm test
```

### Test Coverage
Coverage is collected by Jest configuration and can be expanded during final submission.

---

## Monitoring & Logging

### Monitoring Setup
- Prometheus: Active (`monitoring/prometheus/prometheus.yml`)
- Nagios: Placeholder (`monitoring/nagios/README.md`)
- Alerts: Prometheus alert rules in `monitoring/alerts/rules.yml`

### Logging
- Structured JSON logging with `pino`
- Log retention policy: 30 days
- Optional ELK integration can be added later

---

## Docker & Kubernetes

### Docker Runtime
Project runs with split services:
- `frontend` (React static app)
- `backend` (Express API)
- `gateway` (Nginx reverse proxy on `8080`)

Run:
```bash
docker-compose up --build
```

### Kubernetes Deployment
Build images first:
```bash
docker build -f infrastructure/docker/backend.Dockerfile -t converter-backend:latest .
docker build -f infrastructure/docker/frontend.Dockerfile -t converter-frontend:latest .
```

Apply manifests:
```bash
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/service.yaml
kubectl get pods,svc,deploy
```

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build Time | < 5 min | ~3-5 min (environment dependent) |
| Test Coverage | > 80% | Baseline tests implemented |
| Deployment Frequency | Daily | On-demand during development |
| Mean Time to Recovery | < 1 hour | Manual restart + logs/metrics checks |

---

## Documentation

### User Documentation
- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api-documentation.md)

### Technical Documentation
- [Design Document](docs/design-document.md)
- [Architecture Diagrams](docs/architecture/README.md)

### DevOps Documentation
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

---

## Demo

### Demo Video
Placeholder: `deliverables/demo-video.mp4`

### Live Demo
Local deployment using Docker Compose.

---

## Development Workflow

### Git Branching Strategy
```text
main
├── develop
│   ├── feature/<feature-name>
│   └── hotfix/<hotfix-name>
└── release/<version>
```

### Commit Convention
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Test-related changes
- `refactor`: Refactoring
- `chore`: Maintenance

---

## Security

### Security Measures Implemented
- [x] Input validation and YAML parse validation
- [ ] Authentication and authorization (out of scope for this project)
- [x] Environment-based configuration
- [x] Dependency scan in CI/CD (Trivy)
- [x] Upload size limits for API input

### Security Scanning
```bash
docker compose build backend frontend
trivy image devops_project-backend:latest
trivy image devops_project-frontend:latest
```

---

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m "feat: add amazing feature"`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Faculty Assessment

Self-assessment is available at:
- `deliverables/assessment/self-assessment.md`

Project challenges and learnings are documented in final report and presentation materials.

---

## License
MIT (`LICENSE`)
