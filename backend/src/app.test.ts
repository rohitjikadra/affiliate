import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { SESSION_COOKIE } from "./lib/session.js";

describe("auth API", () => {
  const app = createApp();

  it("rejects a wrong password", async () => {
    const response = await request(app).post("/api/auth/login").send({ password: "nope" });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("sets a session cookie on success and accepts /me", async () => {
    const login = await request(app).post("/api/auth/login").send({ password: "test-admin-password" });
    expect(login.status).toBe(200);

    const cookie = login.headers["set-cookie"];
    expect(cookie?.join(";")).toContain(SESSION_COOKIE);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie ?? []);
    expect(me.status).toBe(200);

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie ?? []);
    expect(logout.status).toBe(200);

    const meAgain = await request(app).get("/api/auth/me");
    expect(meAgain.status).toBe(401);
  });

  it("rejects a junk session cookie", async () => {
    const response = await request(app).get("/api/auth/me").set("Cookie", `${SESSION_COOKIE}=not-a-token`);
    expect(response.status).toBe(401);
  });
});
