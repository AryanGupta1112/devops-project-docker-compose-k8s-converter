import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

const registry = new Registry();
collectDefaultMetrics({ register: registry });

function getOrCreateCounter(): Counter<"method" | "route" | "status"> {
  const existing = registry.getSingleMetric("app_http_requests_total");
  if (existing) {
    return existing as Counter<"method" | "route" | "status">;
  }
  return new Counter({
    name: "app_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [registry]
  });
}

function getOrCreateHistogram(): Histogram<"endpoint"> {
  const existing = registry.getSingleMetric("app_conversion_duration_seconds");
  if (existing) {
    return existing as Histogram<"endpoint">;
  }
  return new Histogram({
    name: "app_conversion_duration_seconds",
    help: "Duration of compose conversion requests in seconds",
    labelNames: ["endpoint"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [registry]
  });
}

export const requestCounter = getOrCreateCounter();
export const conversionDuration = getOrCreateHistogram();
export { registry };
