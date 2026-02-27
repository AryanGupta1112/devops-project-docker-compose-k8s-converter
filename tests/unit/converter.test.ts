import fs from "node:fs";
import path from "node:path";
import { convertComposeToK8s } from "../../src/main/backend/src/services/composeConverter";

describe("convertComposeToK8s", () => {
  it("converts a valid compose file into multiple manifests", () => {
    const compose = fs.readFileSync(path.join(__dirname, "../test-data/sample-compose.yml"), "utf8");
    const result = convertComposeToK8s(compose);

    expect(result.services.length).toBe(2);
    expect(Object.keys(result.manifests)).toContain("web-deployment.yaml");
    expect(Object.keys(result.manifests)).toContain("web-service.yaml");
    expect(Object.keys(result.manifests)).toContain("web-configmap.yaml");
    expect(Object.keys(result.manifests)).toContain("web-secret.yaml");
    expect(result.warnings.some((warning) => warning.includes("depends_on"))).toBe(true);
  });

  it("uses placeholder image when build is provided", () => {
    const compose = `
services:
  api:
    build: .
`;
    const result = convertComposeToK8s(compose);
    const deployment = result.manifests["api-deployment.yaml"];

    expect(deployment).toContain("image: local/api:latest");
    expect(result.warnings.some((warning) => warning.includes("build context"))).toBe(true);
  });

  it("throws on invalid input", () => {
    expect(() => convertComposeToK8s("")).toThrow("Compose YAML input is empty");
    expect(() => convertComposeToK8s("hello: world")).toThrow("services section");
  });
});
