# Dashboards Placeholder

Add Grafana dashboard JSON exports here.

Suggested panels:
- API request rate (`app_http_requests_total`)
- Conversion latency p95 (`app_conversion_duration_seconds`)
- Error ratio for `/api/convert`
- Gateway availability (`up{job=\"converter-gateway\"}`)
- Container CPU and memory (from node exporter / cAdvisor if available)
