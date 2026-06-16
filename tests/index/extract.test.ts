import { describe, expect, it } from "vitest";
import {
  extractTypeScriptSymbols,
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
