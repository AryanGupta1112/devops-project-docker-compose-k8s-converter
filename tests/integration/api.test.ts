import request from "supertest";
import { app } from "../../src/main/backend/src/app";

describe("API integration", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("converts compose yaml from JSON body", async () => {
    const composeYaml = `
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
`;

    const response = await request(app).post("/api/convert").send({ composeYaml });
    expect(response.status).toBe(200);
    expect(response.body.manifests["web-deployment.yaml"]).toContain("kind: Deployment");
    expect(response.body.jobId).toBeDefined();
  });

  it("returns bad request for invalid compose", async () => {
    const response = await request(app).post("/api/convert").send({ composeYaml: "invalid: [yaml" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("downloads zip by jobId", async () => {
    const composeYaml = `
services:
  redis:
    image: redis:7
    ports:
      - "6379:6379"
`;
    const conversion = await request(app).post("/api/convert").send({ composeYaml });
    const jobId = conversion.body.jobId as string;

    const zipResponse = await request(app).get(`/api/download?jobId=${jobId}`);
    expect(zipResponse.status).toBe(200);
    expect(zipResponse.headers["content-type"]).toContain("application/zip");
  });
});
