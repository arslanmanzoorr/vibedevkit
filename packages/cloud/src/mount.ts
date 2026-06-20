import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "@seos/context";

import { registerTools as registerKnowledge } from "@seos/knowledge/dist/register.js";
import { registerTools as registerArchitecture } from "@seos/architecture/dist/register.js";
import { registerTools as registerSecurity } from "@seos/security/dist/register.js";
import { registerTools as registerQa } from "@seos/qa/dist/register.js";
import { registerTools as registerPerformance } from "@seos/performance/dist/register.js";
import { registerTools as registerDevops } from "@seos/devops/dist/register.js";
import { registerTools as registerMemory } from "@seos/memory/dist/register.js";
import { registerTools as registerReviewBoard } from "@seos/review-board/dist/register.js";
import { registerTools as registerSelfHealing } from "@seos/self-healing/dist/register.js";
import { registerTools as registerCompliance } from "@seos/compliance/dist/register.js";

const REGISTRARS = [
  registerKnowledge,
  registerArchitecture,
  registerSecurity,
  registerQa,
  registerPerformance,
  registerDevops,
  registerMemory,
  registerReviewBoard,
  registerSelfHealing,
  registerCompliance,
];

export function mountTools(server: McpServer, ctx: ToolContext, onCall: (tool: string) => void): number {
  let count = 0;
  // Wrap .tool so every handler logs its call. McpServer.tool is overloaded; cast to any to intercept.
  const orig = (server as any).tool.bind(server);
  (server as any).tool = (name: string, ...rest: unknown[]) => {
    count += 1;
    const handler = rest[rest.length - 1] as (...a: unknown[]) => unknown;
    const wrapped = async (...args: unknown[]) => {
      onCall(name);
      return handler(...args);
    };
    rest[rest.length - 1] = wrapped;
    return orig(name, ...rest);
  };
  for (const register of REGISTRARS) register(server, ctx);
  return count;
}
