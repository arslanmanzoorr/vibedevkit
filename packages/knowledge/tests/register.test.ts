import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/register.js";
import { localContext } from "@seos/context";

describe("knowledge registerTools", () => {
  it("registers exactly the four knowledge tools without connecting a transport", () => {
    const names: string[] = [];
    const server = new McpServer({ name: "test", version: "0" });
    const orig = server.tool.bind(server);
    // McpServer.tool is overloaded; cast to any to intercept registration without reimplementing all overloads.
    (server as any).tool = (name: string, ...rest: unknown[]) => {
      names.push(name);
      return (orig as any)(name, ...rest);
    };
    registerTools(server, localContext());
    expect(names.sort()).toEqual(["audit_dependency", "check_versions", "get_knowledge", "verify_api"]);
  });
});
