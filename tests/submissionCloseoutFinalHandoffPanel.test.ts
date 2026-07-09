import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import SubmissionCloseoutFinalHandoffPanel from "../src/SubmissionCloseoutFinalHandoffPanel";
import type { CloseoutFinalSubmitHandoff } from "../src/submissionCloseout";

const handoff: CloseoutFinalSubmitHandoff = {
  id: "final-submit-handoff-test",
  status: "watch",
  readiness: "external-url-watch",
  lockScore: 86,
  headline: "Final form is ready except published URLs",
  summary: "2 external submission fields still need a published URL before final submit.",
  deadline: "2026-07-10 23:59 JST",
  readyCount: 6,
  openCount: 2,
  invalidCount: 0,
  verifyApiPath: "/api/proof-links/verify",
  liveProofLinks: [
    { id: "github-url", label: "Public GitHub repository URL", value: "https://github.com/buddypia/DevOps-AIAgent" },
    { id: "deployed-url", label: "Deployed Cloud Run URL", value: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app" },
    { id: "protopedia-url", label: "ProtoPedia work URL", value: "" },
    { id: "video-url", label: "Video URL", value: "" }
  ],
  fields: [
    {
      id: "github-url",
      label: "Public GitHub repository URL",
      target: "Findy final submission form",
      status: "ready",
      value: "https://github.com/buddypia/DevOps-AIAgent",
      proof: "Public GitHub URL is present.",
      acceptance: "Public GitHub URL can be pasted into the final form."
    },
    {
      id: "protopedia-url",
      label: "ProtoPedia work URL",
      target: "Findy final submission form",
      status: "watch",
      value: "",
      proof: "ProtoPedia work URL is missing.",
      acceptance: "ProtoPedia work URL can be pasted into the final form."
    }
  ],
  pasteOrder: ["Paste public GitHub repository URL into the Findy form.", "Paste ProtoPedia work URL into the Findy form."],
  exportMarkdown: "# Findy final submission handoff",
  exportHref: "data:text/markdown;charset=utf-8,%23%20Findy%20final%20submission%20handoff"
};

describe("SubmissionCloseoutFinalHandoffPanel", () => {
  test("renders final form fields with a live reachability check entry point", () => {
    const html = renderToStaticMarkup(createElement(SubmissionCloseoutFinalHandoffPanel, { handoff }));

    expect(html).toContain("Findy final submission handoff");
    expect(html).toContain("Judge reachability");
    expect(html).toContain("Run live check");
    expect(html).toContain("Public GitHub repository URL");
    expect(html).toContain("Pending external URL");
    expect(html).toContain("findy-final-submission-handoff.md");
  });
});
