import { describe, expect, it } from "vitest";
import { extractTypeScriptSymbols } from "../../src/index/extract.js";

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
});
