import yaml from "js-yaml";

export interface ServiceSummary {
  name: string;
  image: string;
  ports: number[];
  hasConfigMap: boolean;
  hasSecret: boolean;
  volumeCount: number;
}

export interface ConversionResult {
  manifests: Record<string, string>;
  warnings: string[];
  services: ServiceSummary[];
}

interface PortMapping {
  containerPort: number;
  protocol: "TCP" | "UDP";
  raw: string | number;
}

const SENSITIVE_KEY_PATTERN = /(PASS|SECRET|TOKEN|KEY)/i;

function safeName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
}

function toYamlDocument(resource: Record<string, any>): string {
  return yaml.dump(resource, { lineWidth: -1, noRefs: true }).trim();
}

function splitEnv(serviceName: string, environment: unknown, warnings: string[]) {
  const configData: Record<string, string> = {};
  const secretData: Record<string, string> = {};

  if (Array.isArray(environment)) {
    for (const item of environment) {
      if (typeof item !== "string") {
        warnings.push(`[${serviceName}] Unsupported environment entry ignored: ${String(item)}.`);
        continue;
      }

      const [rawKey, ...rest] = item.split("=");
      const key = rawKey?.trim();
      const value = rest.length > 0 ? rest.join("=") : "";
      if (!key) {
        continue;
      }

      if (SENSITIVE_KEY_PATTERN.test(key)) {
        secretData[key] = value;
      } else {
        configData[key] = value;
      }
    }
    return { configData, secretData };
  }

  if (environment && typeof environment === "object") {
    for (const [key, value] of Object.entries(environment as Record<string, unknown>)) {
      const normalizedValue = value == null ? "" : String(value);
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        secretData[key] = normalizedValue;
      } else {
        configData[key] = normalizedValue;
      }
    }
  }

  return { configData, secretData };
}

function normalizeCommand(value: unknown): string[] | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map((part) => String(part));
  }
  if (typeof value === "string") {
    return ["sh", "-c", value];
  }
  return undefined;
}

function parsePorts(serviceName: string, ports: unknown, warnings: string[]): PortMapping[] {
  if (!ports) {
    return [];
  }
  if (!Array.isArray(ports)) {
    warnings.push(`[${serviceName}] Ports should be an array. Ignoring invalid value.`);
    return [];
  }

  const parsed: PortMapping[] = [];
  for (const rawPort of ports) {
    if (typeof rawPort === "number") {
      parsed.push({ containerPort: rawPort, protocol: "TCP", raw: rawPort });
      continue;
    }

    if (typeof rawPort !== "string") {
      warnings.push(`[${serviceName}] Unsupported port mapping ignored: ${String(rawPort)}.`);
      continue;
    }

    const [portPart, protocolPart] = rawPort.split("/");
    const protocol = protocolPart?.toUpperCase() === "UDP" ? "UDP" : "TCP";
    const segments = portPart.split(":");
    let containerPortCandidate = "";
    let hostPortCandidate: string | undefined;

    if (segments.length === 1) {
      [containerPortCandidate] = segments;
    } else if (segments.length === 2) {
      [hostPortCandidate, containerPortCandidate] = segments;
    } else if (segments.length === 3) {
      [, hostPortCandidate, containerPortCandidate] = segments;
    } else {
      warnings.push(`[${serviceName}] Unsupported port format ignored: ${rawPort}.`);
      continue;
    }

    const containerPort = Number.parseInt(containerPortCandidate, 10);
    if (Number.isNaN(containerPort)) {
      warnings.push(`[${serviceName}] Invalid container port ignored: ${rawPort}.`);
      continue;
    }

    if (hostPortCandidate) {
      warnings.push(`[${serviceName}] Host port ${hostPortCandidate} ignored. Kubernetes Service uses container port ${containerPort}.`);
    }

    parsed.push({ containerPort, protocol, raw: rawPort });
  }

  return parsed;
}

interface VolumeConversion {
  volumes: Array<Record<string, any>>;
  volumeMounts: Array<Record<string, any>>;
  pvcResources: Array<Record<string, any>>;
}

function convertVolumes(
  serviceName: string,
  serviceDef: Record<string, any>,
  declaredVolumes: Set<string>,
  warnings: string[]
): VolumeConversion {
  const volumes: Array<Record<string, any>> = [];
  const volumeMounts: Array<Record<string, any>> = [];
  const pvcResources: Array<Record<string, any>> = [];
  const seenClaims = new Set<string>();

  const serviceVolumes = serviceDef.volumes;
  if (!serviceVolumes) {
    return { volumes, volumeMounts, pvcResources };
  }
  if (!Array.isArray(serviceVolumes)) {
    warnings.push(`[${serviceName}] Volumes should be an array. Ignoring invalid value.`);
    return { volumes, volumeMounts, pvcResources };
  }

  serviceVolumes.forEach((entry, index) => {
    let source = "";
    let target = "";
    let readOnly = false;
    let declaredType = "";

    if (typeof entry === "string") {
      const parts = entry.split(":");
      if (parts.length === 1) {
        target = parts[0];
      } else if (parts.length >= 2) {
        [source, target] = parts;
        readOnly = parts[2] === "ro";
      }
    } else if (entry && typeof entry === "object") {
      source = String(entry.source ?? "");
      target = String(entry.target ?? "");
      readOnly = Boolean(entry.read_only);
      declaredType = String(entry.type ?? "");
    } else {
      warnings.push(`[${serviceName}] Unsupported volume ignored: ${String(entry)}.`);
      return;
    }

    if (!target) {
      warnings.push(`[${serviceName}] Volume entry without target ignored.`);
      return;
    }

    const mountName = `${safeName(serviceName)}-vol-${index + 1}`;
    const mountDef: Record<string, any> = {
      name: mountName,
      mountPath: target
    };
    if (readOnly) {
      mountDef.readOnly = true;
    }

    const isWindowsPath = /^[A-Za-z]:\\/.test(source);
    const isBindLikeSource = source.startsWith(".") || source.startsWith("/") || isWindowsPath;
    const isNamedVolume = Boolean(source) && (!isBindLikeSource || declaredVolumes.has(source));

    if (declaredType === "bind" || isBindLikeSource || !source) {
      volumes.push({ name: mountName, emptyDir: {} });
      volumeMounts.push(mountDef);
      warnings.push(`[${serviceName}] Bind/anonymous volume "${source || target}" mapped to emptyDir.`);
      return;
    }

    if (declaredType && declaredType !== "volume" && declaredType !== "bind") {
      volumes.push({ name: mountName, emptyDir: {} });
      volumeMounts.push(mountDef);
      warnings.push(`[${serviceName}] Volume type "${declaredType}" mapped to emptyDir.`);
      return;
    }

    if (isNamedVolume) {
      const claimName = `${safeName(serviceName)}-${safeName(source)}-pvc`;
      volumes.push({
        name: mountName,
        persistentVolumeClaim: { claimName }
      });
      volumeMounts.push(mountDef);

      if (!seenClaims.has(claimName)) {
        pvcResources.push({
          apiVersion: "v1",
          kind: "PersistentVolumeClaim",
          metadata: { name: claimName },
          spec: {
            accessModes: ["ReadWriteOnce"],
            resources: {
              requests: { storage: "1Gi" }
            }
          }
        });
        seenClaims.add(claimName);
      }
      return;
    }

    volumes.push({ name: mountName, emptyDir: {} });
    volumeMounts.push(mountDef);
    warnings.push(`[${serviceName}] Volume "${String(entry)}" mapped to emptyDir.`);
  });

  return { volumes, volumeMounts, pvcResources };
}

export function convertComposeToK8s(composeYaml: string): ConversionResult {
  if (!composeYaml?.trim()) {
    throw new Error("Compose YAML input is empty.");
  }

  let parsedCompose: any;
  try {
    parsedCompose = yaml.load(composeYaml);
  } catch (error) {
    throw new Error(`Failed to parse compose YAML: ${(error as Error).message}`);
  }

  if (!parsedCompose || typeof parsedCompose !== "object") {
    throw new Error("Compose YAML must define an object.");
  }
  if (!parsedCompose.services || typeof parsedCompose.services !== "object") {
    throw new Error("Compose YAML must include a services section.");
  }

  const warnings: string[] = [];
  const manifests: Record<string, string> = {};
  const services: ServiceSummary[] = [];
  const declaredVolumes = new Set<string>(Object.keys(parsedCompose.volumes ?? {}));

  for (const [serviceName, serviceDefRaw] of Object.entries(parsedCompose.services as Record<string, unknown>)) {
    if (!serviceDefRaw || typeof serviceDefRaw !== "object") {
      warnings.push(`[${serviceName}] Invalid service definition ignored.`);
      continue;
    }

    const serviceDef = serviceDefRaw as Record<string, any>;
    const appLabel = safeName(serviceName);

    let image = "";
    if (typeof serviceDef.image === "string" && serviceDef.image.trim()) {
      image = serviceDef.image;
    } else if (serviceDef.build) {
      image = `local/${appLabel}:latest`;
      warnings.push(`[${serviceName}] Compose build context found. Using placeholder image "${image}".`);
    } else {
      image = `local/${appLabel}:latest`;
      warnings.push(`[${serviceName}] Missing image/build. Using placeholder image "${image}".`);
    }

    const ports = parsePorts(serviceName, serviceDef.ports, warnings);
    const { configData, secretData } = splitEnv(serviceName, serviceDef.environment, warnings);
    const { volumes, volumeMounts, pvcResources } = convertVolumes(serviceName, serviceDef, declaredVolumes, warnings);

    if (serviceDef.depends_on) {
      warnings.push(`[${serviceName}] depends_on is not a startup guarantee in Kubernetes. Use readiness checks.`);
    }
    if (serviceDef.networks) {
      warnings.push(`[${serviceName}] Compose networks are ignored in this converter.`);
    }
    if (serviceDef.restart && String(serviceDef.restart).toLowerCase() !== "always") {
      warnings.push(`[${serviceName}] Restart policy "${serviceDef.restart}" is not directly mapped for Deployments.`);
    }

    const deploymentName = `${appLabel}-deployment`;
    const serviceNameK8s = `${appLabel}-service`;
    const configMapName = `${appLabel}-config`;
    const secretName = `${appLabel}-secret`;

    const container: Record<string, any> = {
      name: appLabel,
      image
    };

    const entrypoint = normalizeCommand(serviceDef.entrypoint);
    if (entrypoint) {
      container.command = entrypoint;
    }

    const command = normalizeCommand(serviceDef.command);
    if (command) {
      container.args = command;
    }

    if (ports.length > 0) {
      container.ports = ports.map((port) => ({
        containerPort: port.containerPort,
        protocol: port.protocol
      }));
    }

    const envFrom: Array<Record<string, any>> = [];
    if (Object.keys(configData).length > 0) {
      envFrom.push({ configMapRef: { name: configMapName } });
      manifests[`${appLabel}-configmap.yaml`] = toYamlDocument({
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: { name: configMapName },
        data: configData
      });
    }
    if (Object.keys(secretData).length > 0) {
      envFrom.push({ secretRef: { name: secretName } });
      manifests[`${appLabel}-secret.yaml`] = toYamlDocument({
        apiVersion: "v1",
        kind: "Secret",
        metadata: { name: secretName },
        type: "Opaque",
        stringData: secretData
      });
    }
    if (envFrom.length > 0) {
      container.envFrom = envFrom;
    }

    if (volumes.length > 0) {
      container.volumeMounts = volumeMounts;
    }

    const deploymentManifest: Record<string, any> = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: deploymentName,
        labels: { app: appLabel }
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { app: appLabel }
        },
        template: {
          metadata: {
            labels: { app: appLabel }
          },
          spec: {
            containers: [container]
          }
        }
      }
    };

    if (volumes.length > 0) {
      deploymentManifest.spec.template.spec.volumes = volumes;
    }

    manifests[`${appLabel}-deployment.yaml`] = toYamlDocument(deploymentManifest);

    if (ports.length > 0) {
      manifests[`${appLabel}-service.yaml`] = toYamlDocument({
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: serviceNameK8s,
          labels: { app: appLabel }
        },
        spec: {
          type: "ClusterIP",
          selector: { app: appLabel },
          ports: ports.map((port) => ({
            name: `port-${port.containerPort}`,
            port: port.containerPort,
            targetPort: port.containerPort,
            protocol: port.protocol
          }))
        }
      });
    } else {
      warnings.push(`[${serviceName}] No ports provided. Service manifest was not generated.`);
    }

    pvcResources.forEach((pvc) => {
      const pvcName = String(pvc.metadata?.name ?? `${appLabel}-pvc`);
      manifests[`${pvcName}.yaml`] = toYamlDocument(pvc);
    });

    services.push({
      name: serviceName,
      image,
      ports: ports.map((port) => port.containerPort),
      hasConfigMap: Object.keys(configData).length > 0,
      hasSecret: Object.keys(secretData).length > 0,
      volumeCount: volumeMounts.length
    });
  }

  if (services.length === 0) {
    throw new Error("No valid services were found in the compose file.");
  }

  return { manifests, warnings, services };
}
