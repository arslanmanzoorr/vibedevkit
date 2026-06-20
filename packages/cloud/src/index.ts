#!/usr/bin/env node
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = process.env.SEOS_DATA_DIR ?? "./data";
const MCP_BASE_URL = process.env.SEOS_MCP_BASE_URL ?? `http://localhost:${PORT}`;
const FRONTEND_ORIGIN = process.env.SEOS_FRONTEND_ORIGIN ?? "*";
const ADMIN_SECRET = process.env.SEOS_ADMIN_SECRET ?? "";

if (!ADMIN_SECRET) {
  console.error("SEOS_ADMIN_SECRET is required");
  process.exit(1);
}

const db = openDb(`${DATA_DIR}/aiseos.db`);
const app = createApp({
  db,
  dataDir: DATA_DIR,
  mcpBaseUrl: MCP_BASE_URL,
  frontendOrigin: FRONTEND_ORIGIN,
  adminSecret: ADMIN_SECRET,
});
app.listen(PORT, () => console.log(`@seos/cloud listening on :${PORT}`));
