import { describe, expect, it } from "vitest";
import { verifyPublicProofLink, verifyPublicProofLinks, type PublicProofLinkInput } from "../server/proofLinkVerifier";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];
const PRIVATE_RECORDS = [{ address: "10.0.0.5" }];

function link(value: string): PublicProofLinkInput {
  return {
    id: "target-url",
    label: "Live product",
    value
  };
}

describe("public proof link verifier", () => {
  it("passes a public URL that responds with HTTP 200", async () => {
    const result = await verifyPublicProofLink(link("https://launch.opsbridge.ai/app"), {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url, init) => {
        expect(String(url)).toBe("https://launch.opsbridge.ai/app");
        expect(init?.method).toBe("HEAD");
        return new Response("", {
          status: 200,
          headers: { "content-type": "text/html" }
        });
      }
    });

    expect(result).toMatchObject({
      status: "pass",
      httpStatus: 200,
      finalUrl: "https://launch.opsbridge.ai/app",
      contentType: "text/html"
    });
  });

  it("falls back to a ranged GET when HEAD is not allowed", async () => {
    const methods: string[] = [];
    const result = await verifyPublicProofLink(link("https://launch.opsbridge.ai/video"), {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (_url, init) => {
        methods.push(String(init?.method));
        if (init?.method === "HEAD") {
          return new Response("", { status: 405 });
        }
        expect(init?.headers).toMatchObject({ range: "bytes=0-0" });
        return new Response("ok", { status: 206 });
      }
    });

    expect(methods).toEqual(["HEAD", "GET"]);
    expect(result.status).toBe("pass");
    expect(result.httpStatus).toBe(206);
  });

  it("blocks plain HTTP before fetching buyer-facing proof", async () => {
    let fetched = false;
    const result = await verifyPublicProofLink(link("http://launch.opsbridge.ai/app"), {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async () => {
        fetched = true;
        return new Response("", { status: 200 });
      }
    });

    expect(fetched).toBe(false);
    expect(result).toMatchObject({
      status: "block",
      evidence: "Only https URLs can be verified as buyer-facing proof.",
      action: "Replace Live product with a secure https:// URL."
    });
  });

  it("follows redirects only after validating the redirected host", async () => {
    const requested: string[] = [];
    const result = await verifyPublicProofLink(link("https://launch.opsbridge.ai/old"), {
      resolveHost: async (hostname) => {
        expect(["launch.opsbridge.ai", "cdn.opsbridge.ai"].includes(hostname)).toBe(true);
        return PUBLIC_RECORDS;
      },
      fetchImpl: async (url) => {
        requested.push(String(url));
        if (String(url).endsWith("/old")) {
          return new Response("", {
            status: 302,
            headers: { location: "https://cdn.opsbridge.ai/new" }
          });
        }
        return new Response("", { status: 200 });
      }
    });

    expect(requested).toEqual(["https://launch.opsbridge.ai/old", "https://cdn.opsbridge.ai/new"]);
    expect(result).toMatchObject({
      status: "pass",
      finalUrl: "https://cdn.opsbridge.ai/new"
    });
  });

  it("blocks a ProtoPedia proof URL that is not hosted on ProtoPedia", async () => {
    let fetched = false;
    const result = await verifyPublicProofLink(
      {
        id: "protopediaUrl",
        label: "ProtoPedia URL",
        value: "https://story.opsbridge.ai/prototype/a2a-agent-marketplace"
      },
      {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => {
          fetched = true;
          return new Response("", { status: 200 });
        }
      }
    );

    expect(fetched).toBe(false);
    expect(result).toMatchObject({
      status: "block",
      evidence: "ProtoPedia proof must use a public protopedia.net URL.",
      action: "Replace the ProtoPedia URL with the published ProtoPedia work page."
    });
  });

  it("blocks a final submit GitHub URL that is not hosted on GitHub", async () => {
    let fetched = false;
    const result = await verifyPublicProofLink(
      {
        id: "github-url",
        label: "Public GitHub repository URL",
        value: "https://gitlab.com/buddypia/DevOps-AIAgent"
      },
      {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => {
          fetched = true;
          return new Response("", { status: 200 });
        }
      }
    );

    expect(fetched).toBe(false);
    expect(result).toMatchObject({
      status: "block",
      evidence: "GitHub proof must use a public github.com repository URL.",
      action: "Replace the GitHub field with the public repository URL before final submission."
    });
  });

  it("blocks a deployed URL that points at a submission artifact instead of the running product", async () => {
    let fetched = false;
    const result = await verifyPublicProofLink(
      {
        id: "deployed-url",
        label: "Deployed Cloud Run URL",
        value: "https://youtu.be/demo1234567"
      },
      {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => {
          fetched = true;
          return new Response("", { status: 200 });
        }
      }
    );

    expect(fetched).toBe(false);
    expect(result).toMatchObject({
      status: "block",
      evidence: "Deployed proof must point to the running product, not a repository, ProtoPedia page, or media host.",
      action: "Replace the deployed URL with the public Cloud Run service or production app URL."
    });
  });

  it("keeps ProtoPedia proof host validation across redirects", async () => {
    const result = await verifyPublicProofLink(
      {
        id: "protopediaUrl",
        label: "ProtoPedia URL",
        value: "https://protopedia.net/prototype/a2a-agent-marketplace"
      },
      {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () =>
          new Response("", {
            status: 302,
            headers: { location: "https://story.opsbridge.ai/not-protopedia" }
          })
      }
    );

    expect(result).toMatchObject({
      status: "block",
      evidence: "ProtoPedia proof must use a public protopedia.net URL."
    });
  });

  it("blocks a demo video URL that is not a supported video host", async () => {
    let fetched = false;
    const result = await verifyPublicProofLink(
      {
        id: "videoUrl",
        label: "Demo video",
        value: "https://media.opsbridge.ai/watch/demo"
      },
      {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => {
          fetched = true;
          return new Response("", { status: 200 });
        }
      }
    );

    expect(fetched).toBe(false);
    expect(result).toMatchObject({
      status: "block",
      evidence: "Demo video proof must use YouTube, Vimeo, or a Google Drive backup URL.",
      action: "Replace the demo video URL with a public YouTube or Vimeo URL before buyer sharing."
    });
  });

  it("blocks demo and placeholder domains before fetching generic proof", async () => {
    const blockedValues = [
      ["https://example.com/proof", "example.com demo domain"],
      ["https://proof.example.com/receipt", "example.com demo domain"],
      ["https://launch.example/app", ".example demo domain"],
      ["https://buyer-proof.test/receipt", ".test placeholder domain"],
      ["https://artifact.invalid/receipt", ".invalid placeholder domain"],
      ["https://your-service.run.app", "placeholder deployment host"]
    ];

    for (const [value, reason] of blockedValues) {
      let fetched = false;
      const result = await verifyPublicProofLink(link(value), {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => {
          fetched = true;
          return new Response("", { status: 200 });
        }
      });

      expect(fetched).toBe(false);
      expect(result).toMatchObject({
        status: "block",
        evidence: `The URL uses a ${reason}, so it cannot verify buyer-facing proof.`,
        action: "Replace Live product with a real public artifact URL reviewers can open."
      });
    }
  });

  it("blocks placeholder proof paths on otherwise valid public hosts before fetching", async () => {
    const blockedLinks: PublicProofLinkInput[] = [
      { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/prototype/..." },
      { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/..." },
      { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://proof.opsbridge.ai/..." }
    ];

    for (const input of blockedLinks) {
      let fetched = false;
      const result = await verifyPublicProofLink(input, {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => {
          fetched = true;
          return new Response("", { status: 200 });
        }
      });

      expect(fetched).toBe(false);
      expect(result).toMatchObject({
        status: "block",
        evidence: "The URL still contains a placeholder proof URL, so it cannot verify buyer-facing proof.",
        action: `Replace ${input.label} with a real public artifact URL reviewers can open.`
      });
    }
  });

  it("treats a Google Drive demo video as backup proof instead of buyer-ready video proof", async () => {
    const result = await verifyPublicProofLink(
      {
        id: "videoUrl",
        label: "Demo video",
        value: "https://drive.google.com/file/d/demo"
      },
      {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async () => new Response("", { status: 200 })
      }
    );

    expect(result).toMatchObject({
      status: "watch",
      httpStatus: 200,
      evidence: "Google Drive returned HTTP 200; keep it as backup proof only.",
      action: "Attach a YouTube or Vimeo demo video before sending this proof packet to a buyer."
    });
  });

  it("blocks private DNS results before fetch", async () => {
    let fetched = false;
    const result = await verifyPublicProofLink(link("https://launch.opsbridge.ai/app"), {
      resolveHost: async () => PRIVATE_RECORDS,
      fetchImpl: async () => {
        fetched = true;
        return new Response("", { status: 200 });
      }
    });

    expect(fetched).toBe(false);
    expect(result).toMatchObject({
      status: "block",
      action: "Attach a publicly reachable proof URL that can be opened without private network access."
    });
    expect(result.evidence).toContain("private");
  });

  it("summarizes missing and unstable proof links without throwing", async () => {
    const summary = await verifyPublicProofLinks(
      [
        link(""),
        { id: "pilot", label: "Pilot receipt", value: "https://launch.opsbridge.ai/pilot" },
        { id: "api", label: "API proof", value: "https://launch.opsbridge.ai/api" }
      ],
      {
        now: new Date("2026-06-20T00:00:00.000Z"),
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async (url) => new Response("", { status: String(url).endsWith("/api") ? 503 : 200 })
      }
    );

    expect(summary.checkedAt).toBe("2026-06-20T00:00:00.000Z");
    expect(summary.totalCount).toBe(3);
    expect(summary.verifiedCount).toBe(1);
    expect(summary.results.map((result) => result.status)).toEqual(["block", "pass", "watch"]);
    expect(summary.score).toBeGreaterThan(30);
    expect(summary.score).toBeLessThan(60);
  });
});
