import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db.js";
import { createOrRotateUser, findUserIdByToken, hashToken, generateToken } from "../src/tokens.js";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-tok-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });
const newDb = () => openDb(":memory:");

describe("tokens", () => {
  it("generateToken returns a prefixed token and hashToken is stable", () => {
    const t = generateToken();
    expect(t.startsWith("seos_")).toBe(true);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(t);
  });

  it("creates a user and resolves its token to the userId", () => {
    const db = newDb();
    const { userId, token } = createOrRotateUser(db, "a@x.com");
    expect(userId.startsWith("u_")).toBe(true);
    expect(findUserIdByToken(db, token)).toBe(userId);
    expect(findUserIdByToken(db, "seos_wrong")).toBe(null);
  });

  it("re-signup keeps the same userId but rotates the token (old token stops working)", () => {
    const db = newDb();
    const first = createOrRotateUser(db, "a@x.com");
    const second = createOrRotateUser(db, "a@x.com");
    expect(second.userId).toBe(first.userId);
    expect(second.token).not.toBe(first.token);
    expect(findUserIdByToken(db, second.token)).toBe(first.userId);
    expect(findUserIdByToken(db, first.token)).toBe(null);
  });

  it("does not store the raw token", () => {
    const db = newDb();
    const { token } = createOrRotateUser(db, "a@x.com");
    const rows = db.prepare("SELECT token_hash FROM users").all() as { token_hash: string }[];
    expect(rows[0].token_hash).not.toBe(token);
  });
});
