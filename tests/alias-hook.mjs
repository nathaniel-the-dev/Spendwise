/**
 * Node ESM resolver hook: maps the `@/` path alias onto the repo root so the
 * pure-logic modules can be imported straight from source by `node --test`
 * (which strips TypeScript types natively — no bundler, no test framework).
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = pathToFileURL(process.env.SPENDWISE_ROOT ?? process.cwd() + "/").href;

/**
 * Node's type stripping does not do extension resolution the way a bundler
 * does, so an extensionless specifier (`@/lib/utils`) has to be pointed at the
 * real file. `/index.ts` is tried too, mirroring directory-import behaviour.
 */
function withExtension(url) {
  if (existsSync(fileURLToPath(url))) return url;
  for (const candidate of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    if (existsSync(fileURLToPath(url + candidate))) return url + candidate;
  }
  return null;
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = withExtension(ROOT + specifier.slice(2));
    if (resolved) return nextResolve(resolved, context);
  }
  return nextResolve(specifier, context);
}
