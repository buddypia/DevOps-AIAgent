import { describe, expect, test } from "vitest";
import { ciStatusFromBadge } from "../src/ciProof";

describe("CI proof badge fallback", () => {
  test("treats passing workflow badges as passed", () => {
    expect(ciStatusFromBadge("<svg><text>passing</text></svg>")).toBe("passed");
    expect(ciStatusFromBadge("<svg><text>SUCCESS</text></svg>")).toBe("passed");
  });

  test("treats failing workflow badges as missing", () => {
    expect(ciStatusFromBadge("<svg><text>failing</text></svg>")).toBe("missing");
    expect(ciStatusFromBadge("<svg><text>cancelled</text></svg>")).toBe("missing");
  });

  test("keeps inconclusive badges in watch state", () => {
    expect(ciStatusFromBadge("<svg><text>unknown</text></svg>")).toBe("watch");
  });
});
