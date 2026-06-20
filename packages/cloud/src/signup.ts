import type { Db } from "./db.js";
import { createOrRotateUser } from "./tokens.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface SignupResult {
  userId: string;
  token: string;
  mcpUrl: string;
}

export function signup(db: Db, email: string, mcpBaseUrl: string): SignupResult {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL.test(normalized)) throw new Error("invalid email");
  const { userId, token } = createOrRotateUser(db, normalized);
  return { userId, token, mcpUrl: `${mcpBaseUrl.replace(/\/$/, "")}/mcp` };
}
