import type { VersionCheck } from "../types.js";
import { fetchPackageInfo, type PackageInfo } from "../registry/npm.js";

export interface NpmClient {
  fetchPackageInfo(name: string): Promise<PackageInfo>;
}

const defaultClient: NpmClient = { fetchPackageInfo: (n) => fetchPackageInfo(n) };

export interface VersionRequest {
  name: string;
  requested?: string;
}

export async function checkVersions(
  requests: VersionRequest[],
  client: NpmClient = defaultClient,
): Promise<VersionCheck[]> {
  return Promise.all(
    requests.map(async ({ name, requested }): Promise<VersionCheck> => {
      try {
        const info = await client.fetchPackageInfo(name);
        if (info.deprecated) {
          return {
            name,
            requested,
            latest: info.latest,
            deprecated: true,
            status: "deprecated",
            reason: `${name} is deprecated on the registry`,
          };
        }
        const status = requested && requested !== info.latest ? "outdated" : "ok";
        return {
          name,
          requested,
          latest: info.latest,
          deprecated: false,
          status,
          reason: status === "outdated" ? `requested ${requested}, latest is ${info.latest}` : undefined,
        };
      } catch {
        return { name, requested, latest: "", deprecated: false, status: "unknown" };
      }
    }),
  );
}
