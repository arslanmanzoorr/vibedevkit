import { createHash, randomBytes } from "node:crypto";
import type { Db } from "./db.js";

export function generateToken(): string {
  return `seos_${randomBytes(24).toString("base64url")}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newUserId(): string {
  return `u_${randomBytes(12).toString("base64url")}`;
}

export interface IssuedToken {
  userId: string;
  token: string;
}

export function createOrRotateUser(db: Db, email: string): IssuedToken {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  if (existing) {
    db.prepare("UPDATE users SET token_hash = ? WHERE id = ?").run(tokenHash, existing.id);
    return { userId: existing.id, token };
  }
  const userId = newUserId();
  db.prepare("INSERT INTO users (id, email, token_hash, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    email,
    tokenHash,
    new Date().toISOString(),
  );
  return { userId, token };
}

export function findUserIdByToken(db: Db, token: string): string | null {
  const row = db.prepare("SELECT id FROM users WHERE token_hash = ?").get(hashToken(token)) as { id: string } | undefined;
  return row?.id ?? null;
}
