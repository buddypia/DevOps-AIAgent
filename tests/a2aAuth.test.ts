import { describe, expect, it } from "vitest";

import { a2aAuthConfigured, a2aRequestAuthorized } from "../server/a2aAuth.js";

const ACTION_TOKEN = "a2a-action-" + "x".repeat(40);

describe("A2A authentication", () => {
  it("disables the endpoint unless explicitly enabled with a long token", () => {
    expect(a2aAuthConfigured({})).toBe(false);
    expect(a2aAuthConfigured({ A2A_ENABLED: "true", A2A_ACTION_TOKEN: "short" })).toBe(false);
    expect(a2aAuthConfigured({ A2A_ENABLED: "true", A2A_ACTION_TOKEN: ACTION_TOKEN })).toBe(true);
  });

  it("accepts only the configured action token", () => {
    const env = { A2A_ENABLED: "true", A2A_ACTION_TOKEN: ACTION_TOKEN };
    expect(a2aRequestAuthorized(undefined, env)).toBe(false);
    expect(a2aRequestAuthorized("wrong-token", env)).toBe(false);
    expect(a2aRequestAuthorized(ACTION_TOKEN, env)).toBe(true);
  });
});
