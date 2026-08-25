import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { disconnectPrisma } from "../../config/prisma.js";

describe.runIf(process.env.CI === "true")("health with postgres", () => {
  const app = createApp();

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("returns 200 when the database is up", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.checks.database.status).toBe("up");
  });
});
