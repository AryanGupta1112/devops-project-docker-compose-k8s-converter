# API Documentation

Base URL: `http://localhost:8080/api`

## GET /health
Health check endpoint.

### Response
```json
{
  "status": "ok",
  "timestamp": "2026-02-27T12:00:00.000Z"
}
```

## GET /metrics
Prometheus metrics endpoint.

### Response
- Content-Type: `text/plain; version=0.0.4`
- Includes process and custom metrics:
  - `app_http_requests_total`
  - `app_conversion_duration_seconds`

## POST /convert
Convert Docker Compose YAML to Kubernetes manifests.

### Request Option A (JSON)
```json
{
  "composeYaml": "services:\n  web:\n    image: nginx\n    ports:\n      - \"8080:80\""
}
```

### Request Option B (Multipart Form)
- field name: `composeFile`
- upload file: `docker-compose.yml`

### Success Response
```json
{
  "jobId": "uuid",
  "manifests": {
    "web-deployment.yaml": "apiVersion: apps/v1\nkind: Deployment\n...",
    "web-service.yaml": "apiVersion: v1\nkind: Service\n..."
  },
  "warnings": [
    "[web] Host port 8080 ignored. Kubernetes Service uses container port 80."
  ],
  "services": [
    {
      "name": "web",
      "image": "nginx",
      "ports": [80],
      "hasConfigMap": false,
      "hasSecret": false,
      "volumeCount": 0
    }
  ]
}
```

### Error Response (400/500)
```json
{
  "error": "Failed to parse compose YAML: ..."
}
```

## GET /download?jobId=<id>
Download ZIP for a previous conversion response.

### Response
- Content-Type: `application/zip`
- Attachment with generated manifests.

## POST /download
Generate ZIP directly from provided manifests.

### Request
```json
{
  "manifests": {
    "app-deployment.yaml": "apiVersion: apps/v1\n..."
  }
}
```

### Response
- Content-Type: `application/zip`
