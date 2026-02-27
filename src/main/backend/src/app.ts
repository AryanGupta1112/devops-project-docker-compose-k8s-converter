import dotenv from "dotenv";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { convertComposeToK8s } from "./services/composeConverter";
import { createManifestZip } from "./services/zipService";
import { logger } from "./utils/logger";
import { conversionDuration, registry, requestCounter } from "./utils/metrics";
import { jobStore } from "./utils/jobStore";

dotenv.config();

const uploadLimitMb = Number.parseInt(process.env.UPLOAD_LIMIT_MB ?? "2", 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (Number.isNaN(uploadLimitMb) ? 2 : uploadLimitMb) * 1024 * 1024
  }
});

function resolveStaticDir(): string | null {
  const configured = process.env.STATIC_DIR;
  const candidates = [
    configured,
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "src/main/frontend/dist"),
    path.resolve(process.cwd(), "src/main/backend/public")
  ].filter((item): item is string => Boolean(item));

  const existing = candidates.find((item) => fs.existsSync(item));
  return existing ?? null;
}

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  pinoHttp({
    logger
  })
);

app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    requestCounter.inc({
      method: req.method,
      route: req.path,
      status: String(res.statusCode)
    });
  });
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/metrics", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", registry.contentType);
  res.send(await registry.metrics());
});

app.post("/api/convert", upload.single("composeFile"), async (req: Request, res: Response) => {
  const timer = conversionDuration.startTimer({ endpoint: "/api/convert" });
  try {
    const composeYamlFromFile = req.file?.buffer?.toString("utf8");
    const composeYamlFromBody = typeof req.body.composeYaml === "string" ? req.body.composeYaml : "";
    const composeYaml = composeYamlFromFile || composeYamlFromBody;

    if (!composeYaml?.trim()) {
      res.status(400).json({ error: "Provide a docker-compose YAML via composeFile upload or composeYaml JSON field." });
      return;
    }

    const conversion = convertComposeToK8s(composeYaml);
    const jobId = uuidv4();
    jobStore.set({
      id: jobId,
      manifests: conversion.manifests,
      warnings: conversion.warnings,
      createdAt: Date.now()
    });

    const shouldDownloadZip = req.query.download === "true" || req.body.download === true;
    if (shouldDownloadZip) {
      const zipBuffer = await createManifestZip(conversion.manifests);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="k8s-manifests.zip"');
      res.send(zipBuffer);
      return;
    }

    res.json({
      jobId,
      manifests: conversion.manifests,
      warnings: conversion.warnings,
      services: conversion.services
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    const statusCode = message.includes("parse") || message.includes("Compose YAML") ? 400 : 500;
    req.log.error({ err: error }, "Conversion request failed");
    res.status(statusCode).json({ error: message });
  } finally {
    timer();
  }
});

app.get("/api/download", async (req: Request, res: Response) => {
  const jobId = typeof req.query.jobId === "string" ? req.query.jobId : "";
  if (!jobId) {
    res.status(400).json({ error: "Query parameter jobId is required." });
    return;
  }

  const storedJob = jobStore.get(jobId);
  if (!storedJob) {
    res.status(404).json({ error: "Job not found or expired." });
    return;
  }

  const zipBuffer = await createManifestZip(storedJob.manifests);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${jobId}.zip"`);
  res.send(zipBuffer);
});

app.post("/api/download", async (req: Request, res: Response) => {
  const manifests = req.body?.manifests as Record<string, string> | undefined;
  if (!manifests || typeof manifests !== "object" || Object.keys(manifests).length === 0) {
    res.status(400).json({ error: "Provide manifests object in request body." });
    return;
  }

  const zipBuffer = await createManifestZip(manifests);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="k8s-manifests.zip"');
  res.send(zipBuffer);
});

const staticDir = resolveStaticDir();
if (staticDir) {
  app.use(express.static(staticDir));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  logger.warn("Static frontend directory not found; API-only mode is active.");
}
