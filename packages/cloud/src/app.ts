import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Db } from "./db.js";
import { signup } from "./signup.js";
import { findUserIdByToken } from "./tokens.js";
import { buildContext } from "./context.js";
import { mountTools } from "./mount.js";
import { recordUsage, computeMetric } from "./usage.js";
import { fixedWindow } from "./ratelimit.js";

export interface AppDeps {
  db: Db;
  dataDir: string;
  mcpBaseUrl: string;
  frontendOrigin: string;
  adminSecret: string;
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());

  const signupLimiter = fixedWindow(20, 60_000);
  const mcpLimiter = fixedWindow(120, 60_000);

  // CORS for /api/* (signup is called from the browser frontend)
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", deps.frontendOrigin);
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/signup", (req: Request, res: Response) => {
    const ip = req.ip ?? "unknown";
    if (!signupLimiter(ip)) {
      res.status(429).json({ error: "rate limited" });
      return;
    }
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    try {
      const { token, mcpUrl } = signup(deps.db, email, deps.mcpBaseUrl);
      res.json({ token, mcpUrl });
    } catch {
      res.status(400).json({ error: "invalid email" });
    }
  });

  app.get("/admin/usage", (req: Request, res: Response) => {
    if (req.header("x-admin-secret") !== deps.adminSecret) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    res.json(computeMetric(deps.db, { minCalls: 3, minDays: 2 }));
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const auth = req.header("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const userId = token ? findUserIdByToken(deps.db, token) : null;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!mcpLimiter(userId)) {
      res.status(429).json({ error: "rate limited" });
      return;
    }

    const server = new McpServer({ name: "seos-cloud", version: "0.1.0" });
    mountTools(server, buildContext(userId, deps.dataDir), (tool) => recordUsage(deps.db, userId, tool));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return app;
}
