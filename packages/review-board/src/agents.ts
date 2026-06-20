import type { PullRequest, ReviewAgent, Vote } from "./types.js";

const CODE = /\.(?:ts|tsx|js|jsx)$/;
const DOC = /(?:readme)|(?:\.md$)|(?:(?:^|\/)docs\/)/i;
const SECRET = /sk-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/;
const MAX_FILE_CHARS = 50_000;

function approve(name: string): Vote {
  return { name, vote: "approve", recommendations: [] };
}

export const documentationAgent: { name: string; review(pr: PullRequest): Vote } = {
  name: "documentation",
  review(pr: PullRequest): Vote {
    const touchesCode = pr.files.some((f) => CODE.test(f.path));
    const touchesDocs = pr.files.some((f) => DOC.test(f.path));
    if (touchesCode && !touchesDocs && !pr.description) {
      return { name: "documentation", vote: "reject", recommendations: ["Add documentation or a PR description for these code changes."] };
    }
    return approve("documentation");
  },
};

export const secretAgent: { name: string; review(pr: PullRequest): Vote } = {
  name: "security-secrets",
  review(pr: PullRequest): Vote {
    const hits = pr.files.filter((f) => SECRET.test(f.content)).map((f) => `Possible secret in ${f.path}`);
    return hits.length > 0 ? { name: "security-secrets", vote: "reject", recommendations: hits } : approve("security-secrets");
  },
};

export const largeFileAgent: { name: string; review(pr: PullRequest): Vote } = {
  name: "large-file",
  review(pr: PullRequest): Vote {
    const hits = pr.files.filter((f) => f.content.length > MAX_FILE_CHARS).map((f) => `${f.path} exceeds ${MAX_FILE_CHARS} chars; split it.`);
    return hits.length > 0 ? { name: "large-file", vote: "reject", recommendations: hits } : approve("large-file");
  },
};

export const defaultAgents: ReviewAgent[] = [documentationAgent, secretAgent, largeFileAgent];
