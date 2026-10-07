import { generateKeyPairSync, createHmac } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testJwtSecret = "api-response-shape-test-secret";
const testUserId = "usr-api-response-shape-test";
let serverProcess: ChildProcessWithoutNullStreams | undefined;
let baseUrl = "";
let startupOutput = "";
let sessionToken = "";
let serverExit: Promise<void> | undefined;

function makeSessionToken(): string {
  const encodedHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify({
    id: testUserId,
    username: "response_shape_test",
    name: "Response Shape Test",
    tier: "free",
  })).toString("base64url");
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", testJwtSecret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

async function reservePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a test port.");
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return address.port;
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (serverProcess?.exitCode !== null && serverProcess?.exitCode !== undefined) {
      throw new Error(`Test API server exited before becoming ready.\n${startupOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/v1/personas`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error(`Timed out waiting for the test API server.\n${startupOutput}`);
}

async function getJson(path: string, init?: RequestInit): Promise<{ response: Response; body: unknown }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { response, body: await response.json() };
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an object JSON response.");
  }
  return value as Record<string, unknown>;
}

beforeAll(async () => {
  const port = await reservePort();
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const firebasePrivateKey = privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const testSecret = "disposable-api-response-shape-credential";
  baseUrl = `http://127.0.0.1:${port}`;
  sessionToken = makeSessionToken();
  serverProcess = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      APP_ENV: "staging",
      NODE_ENV: "production",
      ENABLE_BACKGROUND_JOBS: "false",
      DATABASE_URL: "",
      POSTGRES_URL: "",
      PORT: String(port),
      ADMIN_TOKEN: testSecret,
      JWT_SECRET: testJwtSecret,
      FIREBASE_PROJECT_ID: "g-age-response-shape-test",
      FIREBASE_CLIENT_EMAIL: "response-shape-test@example.invalid",
      FIREBASE_PRIVATE_KEY: firebasePrivateKey,
      GEMINI_API_KEY: "",
      OPENROUTER_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverExit = new Promise((resolve) => serverProcess?.once("exit", () => resolve()));
  serverProcess.stdout.on("data", (chunk: Buffer) => {
    startupOutput = `${startupOutput}${chunk.toString()}`.slice(-12000);
  });
  serverProcess.stderr.on("data", (chunk: Buffer) => {
    startupOutput = `${startupOutput}${chunk.toString()}`.slice(-12000);
  });
  await waitForServer(30_000);
}, 35_000);

afterAll(async () => {
  if (!serverProcess || !serverExit || serverProcess.exitCode !== null) return;
  serverProcess.kill("SIGTERM");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const gracefulStop = await Promise.race([
    serverExit.then(() => true),
    new Promise<boolean>((resolve) => {
      timeout = setTimeout(() => resolve(false), 5_000);
    }),
  ]);
  if (timeout) clearTimeout(timeout);
  if (!gracefulStop && serverProcess.exitCode === null) {
    serverProcess.kill("SIGKILL");
    await serverExit;
  }
}, 10_000);

describe("API response shapes", () => {
  it("returns the public persona collection and recent-persona envelope", async () => {
    const collection = await getJson("/api/v1/personas");
    const collectionBody = asObject(collection.body);
    expect(collection.response.status).toBe(200);
    expect(collectionBody.success).toBe(true);
    expect(Array.isArray(collectionBody.personas)).toBe(true);
    expect((collectionBody.personas as unknown[]).length).toBeGreaterThan(0);
    expect(asObject((collectionBody.personas as unknown[])[0])).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        slug: expect.any(String),
        name: expect.any(String),
      }),
    );

    const recent = await getJson("/api/v1/personas/recent");
    expect(recent.response.status).toBe(200);
    expect(recent.body).toEqual({ success: true, personas: [] });
  });

  it("returns usage counts and reset metadata with the expected JSON types", async () => {
    const { response, body } = await getJson("/api/usage?tab=notes");
    const usage = asObject(body);
    expect(response.status).toBe(200);
    expect(usage).toEqual(expect.objectContaining({
      loggedIn: expect.any(Boolean),
      tier: expect.any(String),
      tab: "notes",
      deviceLimit: expect.any(Number),
      deviceCount: expect.any(Number),
      deviceRemaining: expect.any(Number),
      accountLimit: expect.any(Number),
      accountCount: expect.any(Number),
      accountRemaining: expect.any(Number),
      guestLifetimeLimit: expect.any(Number),
      guestLifetimeCount: expect.any(Number),
      limit: expect.any(Number),
      count: expect.any(Number),
      used: expect.any(Number),
      remaining: expect.any(Number),
      resetInSeconds: expect.any(Number),
    }));
    expect("proExpiresAt" in usage).toBe(true);
  });

  it("returns both logged-out and authenticated /auth/me envelopes", async () => {
    const loggedOut = await getJson("/api/auth/me");
    expect(loggedOut.response.status).toBe(200);
    expect(loggedOut.body).toEqual({ user: null, tier: "logged_out" });

    const authenticated = await getJson("/api/auth/me", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    const authenticatedBody = asObject(authenticated.body);
    expect(authenticated.response.status).toBe(200);
    expect(asObject(authenticatedBody.user)).toEqual(expect.objectContaining({
      id: testUserId,
      username: "response_shape_test",
      tier: "free",
    }));
    expect("tier" in authenticatedBody).toBe(false);
  });

  it("returns structured validation errors from Google sign-in and chat", async () => {
    const missingGoogleToken = await getJson("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(missingGoogleToken.response.status).toBe(400);
    expect(asObject(missingGoogleToken.body).error).toEqual(expect.any(String));

    const invalidGoogleToken = await getJson("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "not-a-firebase-token" }),
    });
    expect(invalidGoogleToken.response.status).toBe(401);
    expect(asObject(invalidGoogleToken.body).error).toEqual(expect.any(String));

    const invalidChatRequest = await getJson("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    expect(invalidChatRequest.response.status).toBe(400);
    expect(asObject(invalidChatRequest.body).error).toEqual(expect.any(String));
  });

  it("returns authenticated note arrays and created-note records", async () => {
    const unauthorized = await getJson("/api/notes");
    expect(unauthorized.response.status).toBe(401);
    expect(asObject(unauthorized.body).error).toEqual(expect.any(String));

    const headers = {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    };
    const initialNotes = await getJson("/api/notes", { headers });
    expect(initialNotes.response.status).toBe(200);
    expect(Array.isArray(initialNotes.body)).toBe(true);

    const created = await getJson("/api/notes", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Response shape",
        content: "Notes API contract",
        subject_tag: "Testing",
        tags: ["contract"],
      }),
    });
    const note = asObject(created.body);
    expect(created.response.status).toBe(201);
    expect(note).toEqual(expect.objectContaining({
      id: expect.any(String),
      user_id: testUserId,
      title: "Response shape",
      content: "Notes API contract",
      subject_tag: "Testing",
      tags: ["contract"],
      created_at: expect.any(String),
      updated_at: expect.any(String),
    }));

    const listed = await getJson("/api/notes", { headers });
    expect(listed.response.status).toBe(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: note.id })]));
  });
});
