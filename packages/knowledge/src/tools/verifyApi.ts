import type { ApiCheck } from "../types.js";

export type ModuleLoader = (pkg: string) => Promise<unknown>;

const defaultLoader: ModuleLoader = (pkg) => import(pkg);

export async function verifyApi(
  pkg: string,
  symbolPath: string,
  loader: ModuleLoader = defaultLoader,
): Promise<ApiCheck> {
  let mod: unknown;
  try {
    mod = await loader(pkg);
  } catch {
    return { package: pkg, symbolPath, exists: false, checked: [] };
  }

  const segments = symbolPath.split(".").filter(Boolean);
  const checked: string[] = [];
  let current: unknown = mod;

  for (const seg of segments) {
    if (current !== null && typeof current === "object" && seg in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[seg];
      checked.push(seg);
    } else {
      return { package: pkg, symbolPath, exists: false, checked };
    }
  }

  return { package: pkg, symbolPath, exists: true, checked };
}
