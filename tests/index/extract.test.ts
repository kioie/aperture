import { describe, expect, it } from "vitest";
import {
  buildFileExportMap,
  extractReExportsTs,
  extractTypeScriptSymbols,
  isBarrelFile,
  resolveImportPath,
} from "../../src/index/extract.js";

describe("extractTypeScriptSymbols", () => {
  it("finds functions and classes", () => {
    const src = `
export class AuthService {
  async login(user: string) {
    return this.validate(user);
  }
  validate(user: string) {
    return true;
  }
}
export function helper() {}
`;
    const nodes = extractTypeScriptSymbols("src/auth.ts", src);
    const names = nodes.map((n) => n.name);
    expect(names).toContain("AuthService");
    expect(names).toContain("helper");
  });

  it("finds class methods", () => {
    const src = `
export class AuthService {
  async login(user: string) {
    return this.validate(user);
  }
  validate(user: string) {
    return true;
  }
}
`;
    const nodes = extractTypeScriptSymbols("src/auth.ts", src);
    expect(nodes.some((n) => n.name === "AuthService.login")).toBe(true);
  });

  it("spans full function body when params contain braces", () => {
    const src = `
export async function handleLogin(req: { body: { user: string } }) {
  const ok = await login(req.body.user);
  return ok;
}
`;
    const nodes = extractTypeScriptSymbols("src/api/router.ts", src);
    const fn = nodes.find((n) => n.name === "handleLogin");
    expect(fn?.endLine).toBeGreaterThan(fn?.startLine ?? 0);
    expect(fn?.endLine).toBe(5);
  });
});

describe("resolveImportPath", () => {
  const known = new Set(["src/auth/login.ts", "src/api/router.ts"]);

  it("resolves relative imports with extension stripping", () => {
    expect(resolveImportPath("src/api/router.ts", "../auth/login.js", known)).toBe(
      "src/auth/login.ts",
    );
  });

  it("returns null for unknown modules", () => {
    expect(resolveImportPath("src/api/router.ts", "../missing/foo.js", known)).toBeNull();
  });
});

describe("extractReExportsTs", () => {
  it("parses named and star re-exports", () => {
    const src = `
export { login, validateCredentials as check } from "./login.js";
export * from "./session.js";
`;
    const re = extractReExportsTs(src);
    expect(re).toHaveLength(2);
    expect(re[0]?.spec).toBe("./login.js");
    expect(re[0]?.names).toEqual([
      { source: "login", exported: "login" },
      { source: "validateCredentials", exported: "check" },
    ]);
    expect(re[1]?.spec).toBe("./session.js");
    expect(re[1]?.names).toEqual([]);
  });
});

describe("isBarrelFile", () => {
  it("detects barrel index files", () => {
    expect(isBarrelFile('export { foo } from "./foo.js";\n')).toBe(true);
    expect(isBarrelFile("export function foo() {}\n")).toBe(false);
  });
});

describe("buildFileExportMap", () => {
  it("follows re-exports to source symbols", () => {
    const loginSrc = "export function login() {}\nexport function validateCredentials() {}";
    const barrelSrc = 'export { login } from "./login.js";';
    const fileSymbols = new Map([
      ["src/auth/login.ts", extractTypeScriptSymbols("src/auth/login.ts", loginSrc)],
      ["src/auth/index.ts", extractTypeScriptSymbols("src/auth/index.ts", barrelSrc)],
    ]);
    const fileContents = new Map([
      ["src/auth/login.ts", loginSrc],
      ["src/auth/index.ts", barrelSrc],
    ]);
    const known = new Set(["src/auth/login.ts", "src/auth/index.ts"]);
    const cache = new Map();
    const map = buildFileExportMap(
      "src/auth/index.ts",
      fileSymbols,
      fileContents,
      known,
      cache,
    );
    expect(map.get("login")).toEqual({ file: "src/auth/login.ts", symbolName: "login" });
  });

  it("reuses cached export maps for the same file", () => {
    const loginSrc = "export function login() {}\n";
    const barrelSrc = 'export { login } from "./login.js";';
    const fileSymbols = new Map([
      ["src/auth/login.ts", extractTypeScriptSymbols("src/auth/login.ts", loginSrc)],
      ["src/auth/index.ts", extractTypeScriptSymbols("src/auth/index.ts", barrelSrc)],
    ]);
    const fileContents = new Map([
      ["src/auth/login.ts", loginSrc],
      ["src/auth/index.ts", barrelSrc],
    ]);
    const known = new Set(["src/auth/login.ts", "src/auth/index.ts"]);
    const cache = new Map();

    const first = buildFileExportMap(
      "src/auth/index.ts",
      fileSymbols,
      fileContents,
      known,
      cache,
    );
    const second = buildFileExportMap(
      "src/auth/index.ts",
      fileSymbols,
      fileContents,
      known,
      cache,
    );

    expect(second).toBe(first);
    expect(cache.size).toBe(2);
  });
});
