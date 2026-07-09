import {
  QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM,
  QUICK_EXTERNAL_REVIEW_RESPONSE_KEY_PARAM,
  QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM
} from "../src/quickExternalReviewPacketShare.js";

export const QUICK_EXTERNAL_REVIEW_PACKET_REVIEW_PATH = "/external-review-packet";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value: string) {
  return value.replace(/&/g, "\\u0026").replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

export function renderQuickExternalReviewPacketReviewHtml(input: {
  apiUrl: string;
  artifactApiUrl: string;
  artifactSetApiUrl: string;
  decisionApiUrl: string;
  sampleRequestJson?: string;
  initialStatusLabel?: string;
  autoVerify?: boolean;
  storedRequestKey?: string;
  links?: {
    receiptVerifierUrl?: string;
    appUrl?: string;
  };
}) {
  const sampleRequestJson = input.sampleRequestJson ?? "";
  const initialStatusLabel =
    input.initialStatusLabel ?? "Paste an exported quick external review packet manifest, then generate the reviewer memo.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>External Review Packet Desk</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #5b6966; --paper: #eef3ef; --panel: #fffdf7; --line: #c8d6cf; --green: #13745f; --blue: #2457a6; --amber: #b98112; --red: #a82135; --dark: #14201d; }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: var(--paper); font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) minmax(250px, 370px); gap: 12px; padding: 30px 0 12px; align-items: stretch; }
      .hero, .stamp, .desk, .memo, .response-panel, .source-panel, .artifact-verifier, .artifact-result, .artifact-set-verifier, .artifact-set-result, .test-card, .artifact-card { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 16px 34px rgba(23,33,38,.07); }
      .hero, .stamp, .desk, .memo, .response-panel, .source-panel, .artifact-verifier, .artifact-result, .artifact-set-verifier, .artifact-set-result, .test-card, .artifact-card { min-width: 0; }
      .hero { padding: 22px; }
      .stamp { display: grid; align-content: end; gap: 8px; padding: 18px; color: #fffdf7; background: var(--dark); }
      .eyebrow, .stamp span, .memo span, .response-panel span, .artifact-verifier span, .artifact-result span, .artifact-set-verifier span, .artifact-set-result span, .test-card span, .artifact-card span, .source-panel span { color: var(--green); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      .stamp span { color: #aee8cf; }
      h1 { max-width: 840px; margin: 8px 0 10px; font-size: clamp(2rem, 4.9vw, 4.45rem); line-height: .98; letter-spacing: 0; }
      h2, h3 { margin: 0; line-height: 1.2; letter-spacing: 0; }
      h2 { font-size: clamp(1.35rem, 2.8vw, 2rem); }
      h3 { font-size: 1rem; }
      p, small, li { color: var(--muted); }
      p { margin: 0; }
      nav, .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a, button, .actions a { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: #fff; font: inherit; font-size: .86rem; font-weight: 900; text-decoration: none; cursor: pointer; }
      button.primary, .actions a.primary { color: #fffdf7; border-color: var(--dark); background: var(--dark); }
      button:disabled { cursor: default; opacity: .72; }
      code, pre, textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .stamp strong { font-size: clamp(2.3rem, 7.4vw, 4.4rem); line-height: .9; overflow-wrap: anywhere; }
      .stamp small { color: rgba(255,253,247,.74); font-weight: 850; overflow-wrap: anywhere; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .desk { display: grid; grid-template-columns: minmax(0, .9fr) minmax(280px, .46fr); gap: 12px; padding: 14px; }
      textarea { width: 100%; min-height: 380px; resize: vertical; border: 1px solid var(--line); border-radius: 8px; padding: 12px; color: var(--ink); background: #f9fbf8; font-size: .84rem; line-height: 1.48; overflow-wrap: normal; }
      .side { min-width: 0; display: grid; align-content: start; gap: 10px; }
      .status-line { min-height: 24px; font-weight: 850; color: var(--muted); overflow-wrap: anywhere; }
      .memo { display: none; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 12px; padding: 14px; border-left: 6px solid var(--amber); }
      .memo[data-open="true"] { display: grid; }
      .memo[data-decision="accept-external-review"] { border-left-color: var(--green); background: #edf8f1; }
      .memo[data-decision="hold-for-recheck"] { border-left-color: var(--amber); background: #fff8e7; }
      .memo[data-decision="do-not-send"] { border-left-color: var(--red); background: #fff4f4; }
      .memo-copy { min-width: 0; display: grid; gap: 8px; align-content: start; }
      .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .metrics div { min-width: 0; padding: 9px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: rgba(255,253,247,.76); font-size: .8rem; font-weight: 850; overflow-wrap: anywhere; }
      .metrics b { display: block; margin-top: 2px; color: var(--ink); font-size: 1.05rem; overflow-wrap: anywhere; }
      .response-panel { display: none; grid-template-columns: minmax(0, .58fr) minmax(280px, .42fr); gap: 12px; padding: 14px; border-left: 6px solid var(--blue); }
      .response-panel[data-open="true"] { display: grid; }
      .response-copy, .response-form, .response-output { min-width: 0; display: grid; gap: 9px; align-content: start; }
      .decision-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
      .decision-options label { min-width: 0; display: grid; gap: 3px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.78); font-size: .82rem; font-weight: 950; cursor: pointer; }
      .decision-options small { font-size: .72rem; }
      .response-form input, .response-form textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; color: var(--ink); background: #f9fbf8; font: inherit; }
      .response-form textarea { min-height: 104px; resize: vertical; }
      .response-output { display: none; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.78); }
      .response-output[data-open="true"] { display: grid; }
      .response-output-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .response-output-actions a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 7px 10px; color: var(--ink); background: #fff; font-size: .82rem; font-weight: 900; text-decoration: none; }
      .tests { display: none; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .tests[data-open="true"] { display: grid; }
      .test-card { display: grid; gap: 8px; padding: 13px; border-top: 5px solid var(--amber); }
      .test-card.ready { border-top-color: var(--green); background: #edf8f1; }
      .test-card.blocked { border-top-color: var(--red); background: #fff4f4; }
      .test-card p, .test-card small { margin: 0; overflow-wrap: anywhere; }
      .test-card a { width: fit-content; min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 7px 10px; color: var(--ink); background: #fff; font-size: .82rem; font-weight: 900; text-decoration: none; }
      .artifact-ledger { display: none; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .artifact-ledger[data-open="true"] { display: grid; }
      .artifact-card { display: grid; gap: 9px; padding: 13px; scroll-margin-top: 18px; border-left: 5px solid var(--amber); }
      .artifact-card.ready { border-left-color: var(--green); background: #edf8f1; }
      .artifact-card.blocked { border-left-color: var(--red); background: #fff4f4; }
      .artifact-card p, .artifact-card small { margin: 0; overflow-wrap: anywhere; }
      .artifact-card dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin: 0; }
      .artifact-card div { min-width: 0; padding: 8px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.78); }
      .artifact-card dt { color: var(--muted); font-size: .72rem; font-weight: 900; text-transform: uppercase; }
      .artifact-card dd { margin: 2px 0 0; color: var(--ink); font-weight: 900; overflow-wrap: anywhere; }
      .artifact-verifier { display: none; grid-template-columns: minmax(0, .45fr) minmax(0, .55fr); gap: 12px; padding: 14px; border-left: 6px solid var(--blue); }
      .artifact-verifier[data-open="true"] { display: grid; }
      .artifact-verifier h2 { line-height: 1.28; }
      .artifact-verifier-form, .artifact-result { min-width: 0; display: grid; align-content: start; gap: 9px; }
      .artifact-verifier select, .artifact-verifier textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; color: var(--ink); background: #f9fbf8; font: inherit; }
      .artifact-verifier textarea { min-height: 210px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .82rem; line-height: 1.48; }
      .artifact-result { display: none; padding: 12px; box-shadow: none; }
      .artifact-result[data-open="true"] { display: grid; }
      .artifact-result.verified { border-left: 5px solid var(--green); background: #edf8f1; }
      .artifact-result.mismatch { border-left: 5px solid var(--red); background: #fff4f4; }
      .artifact-set-verifier { display: none; grid-template-columns: minmax(0, .45fr) minmax(0, .55fr); gap: 12px; padding: 14px; border-left: 6px solid var(--green); }
      .artifact-set-verifier[data-open="true"] { display: grid; }
      .artifact-set-verifier h2 { line-height: 1.28; }
      .artifact-set-form, .artifact-set-result { min-width: 0; display: grid; align-content: start; gap: 9px; }
      .artifact-set-verifier textarea { width: 100%; min-height: 180px; resize: vertical; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; color: var(--ink); background: #f9fbf8; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .82rem; line-height: 1.48; }
      .artifact-set-result { display: none; padding: 12px; box-shadow: none; }
      .artifact-set-result[data-open="true"] { display: grid; }
      .artifact-set-result.verified { border-left: 5px solid var(--green); background: #edf8f1; }
      .artifact-set-result.mismatch { border-left: 5px solid var(--red); background: #fff4f4; }
      .source-panel { display: none; grid-template-columns: minmax(0, .45fr) minmax(0, .55fr); gap: 12px; padding: 14px; }
      .source-panel[data-open="true"] { display: grid; }
      .receipt-list { display: grid; gap: 7px; margin: 10px 0 0; padding: 0; list-style: none; }
      .receipt-list li { min-width: 0; padding: 8px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.78); overflow-wrap: anywhere; }
      pre { min-width: 0; max-height: 420px; margin: 0; padding: 12px; border-radius: 8px; color: #fffdf7; background: var(--dark); white-space: pre-wrap; overflow: auto; }
      footer { padding-bottom: 26px; color: var(--muted); font-size: .82rem; }
      @media (max-width: 960px) { header, .desk, .memo, .response-panel, .artifact-verifier, .artifact-set-verifier, .source-panel, .tests, .artifact-ledger { grid-template-columns: 1fr; } .stamp { min-height: 150px; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero, .stamp, .desk, .memo, .response-panel, .source-panel, .test-card, .artifact-card { padding: 12px; } nav a, button, .actions a, .test-card a, .response-output-actions a { width: 100%; } .metrics, .artifact-card dl, .decision-options { grid-template-columns: 1fr; } textarea { min-height: 310px; } }
    </style>
  </head>
  <body>
    <header>
      <section class="hero">
        <span class="eyebrow">External Review Packet Desk</span>
        <h1>Turn a packet manifest into a reviewer decision.</h1>
        <p>Verify the quick external review packet receipt, inspect the acceptance tests, and export a memo a sponsor can act on.</p>
        <nav>
          ${input.links?.receiptVerifierUrl ? `<a href="${escapeHtml(input.links.receiptVerifierUrl)}">Receipt verifier</a>` : ""}
          ${input.links?.appUrl ? `<a href="${escapeHtml(input.links.appUrl)}">Open workbench</a>` : ""}
        </nav>
      </section>
      <aside class="stamp">
        <span>Packet verifier API</span>
        <strong id="external-review-packet-stamp">Waiting</strong>
        <small>${escapeHtml(input.apiUrl)}</small>
      </aside>
    </header>
    <main>
      <section class="desk" aria-label="External review packet input">
        <div>
          <textarea id="external-review-packet-input" spellcheck="false" aria-label="External review packet manifest JSON" placeholder="Paste the packet manifest JSON or { &quot;manifest&quot;: ... }.">${escapeHtml(sampleRequestJson)}</textarea>
        </div>
        <aside class="side">
          <span class="eyebrow">Reviewer input</span>
          <h2>Generated packet manifest</h2>
          <p>The reviewer desk only trusts manifests that verify against the exported checksum, receipt id, clearance rule, and ordered artifacts.</p>
          <button class="primary" id="external-review-packet-submit" type="button">Verify and render memo</button>
          <button id="external-review-packet-reset" type="button">Restore loaded input</button>
          <small class="status-line" id="external-review-packet-status">${escapeHtml(initialStatusLabel)}</small>
        </aside>
      </section>
      <section class="memo" id="external-review-packet-memo" data-open="false" data-decision="waiting" aria-live="polite">
        <div class="memo-copy">
          <span id="external-review-packet-kicker">No packet checked yet</span>
          <h2 id="external-review-packet-title">Waiting for a verified packet</h2>
          <p id="external-review-packet-summary">Run the verifier to generate a reviewer decision memo.</p>
          <p id="external-review-packet-rule"></p>
          <div class="actions">
            <a class="primary" id="external-review-packet-download" href="#" download="quick-external-reviewer-decision-memo.md">Download memo</a>
          </div>
        </div>
        <div class="metrics" aria-label="Reviewer memo metrics">
          <div>Decision<b id="external-review-packet-decision">none</b></div>
          <div>Confidence<b id="external-review-packet-confidence">0/100</b></div>
          <div>Tests ready<b id="external-review-packet-ready">0/6</b></div>
          <div>Manifest<b id="external-review-packet-receipt">none</b></div>
        </div>
      </section>
      <section class="tests" id="external-review-packet-tests" data-open="false" aria-label="Reviewer acceptance tests"></section>
      <section class="response-panel" id="external-review-response-panel" data-open="false" aria-label="External reviewer response receipt">
        <div class="response-copy">
          <span>Reviewer response</span>
          <h2>Record continue, revise, or stop as a receipt.</h2>
          <p>The reviewer response attaches to the verified packet manifest and produces a checksum-backed receipt that can be checked from the receipt desk.</p>
          <div class="response-output" id="external-review-response-output" data-open="false" aria-live="polite">
            <span id="external-review-response-kicker">No response recorded yet</span>
            <h3 id="external-review-response-title">Waiting for reviewer response</h3>
            <p id="external-review-response-summary">Choose a decision and generate a receipt.</p>
            <div class="response-output-actions">
              <a id="external-review-response-json" href="#" download="external-review-decision-receipt.json">Receipt JSON</a>
              <a id="external-review-response-markdown" href="#" download="external-review-decision-receipt.md">Decision memo</a>
              <a id="external-review-response-verify" href="#" target="_blank" rel="noreferrer">Verify receipt</a>
              <a id="external-review-response-workbench" href="#" target="_blank" rel="noreferrer">Open workbench with response</a>
            </div>
          </div>
        </div>
        <div class="response-form">
          <span>Decision</span>
          <div class="decision-options" role="radiogroup" aria-label="Reviewer decision">
            <label><input type="radio" name="external-review-decision" value="continue" /> Continue <small>Accept the packet for external review.</small></label>
            <label><input type="radio" name="external-review-decision" value="revise" checked /> Revise <small>Hold until named proof is repaired.</small></label>
            <label><input type="radio" name="external-review-decision" value="stop" /> Stop <small>Do not send this packet forward.</small></label>
          </div>
          <label>
            <span>Reviewer name</span>
            <input id="external-review-response-reviewer" type="text" value="External reviewer" maxlength="180" />
          </label>
          <label>
            <span>Reviewer note</span>
            <textarea id="external-review-response-note" maxlength="1600">Hold until the first open proof item is repaired and the packet is re-exported.</textarea>
          </label>
          <button class="primary" id="external-review-response-submit" type="button">Generate response receipt</button>
          <small class="status-line" id="external-review-response-status">A verified packet is required before recording a response.</small>
        </div>
      </section>
      <section class="artifact-ledger" id="external-review-packet-artifacts" data-open="false" aria-label="External review artifact ledger"></section>
      <section class="artifact-verifier" id="external-review-artifact-verifier" data-open="false" aria-label="Artifact content verifier">
        <div class="artifact-verifier-form">
          <span>Artifact content check</span>
          <h2>Paste an artifact markdown file and verify its manifest hash.</h2>
          <p>The packet manifest stores each artifact's markdown checksum and length. Use this before accepting a downloaded certificate, reviewer brief, claim audit, or proof window note.</p>
          <label>
            <span>Artifact</span>
            <select id="external-review-artifact-select" aria-label="Artifact to verify"></select>
          </label>
          <label>
            <span>Markdown content</span>
            <textarea id="external-review-artifact-content" spellcheck="false" aria-label="Artifact markdown content" placeholder="Paste the downloaded artifact markdown here."></textarea>
          </label>
          <button class="primary" id="external-review-artifact-submit" type="button">Verify artifact content</button>
          <small class="status-line" id="external-review-artifact-status">Verify a packet manifest before checking artifact content.</small>
        </div>
        <div class="artifact-result" id="external-review-artifact-result" data-open="false" aria-live="polite">
          <span id="external-review-artifact-result-kicker">No artifact checked yet</span>
          <h3 id="external-review-artifact-result-title">Waiting for markdown</h3>
          <p id="external-review-artifact-result-summary">Paste an artifact markdown export to compare it with the manifest.</p>
          <pre id="external-review-artifact-result-json">{}</pre>
        </div>
      </section>
      <section class="artifact-set-verifier" id="external-review-artifact-set-verifier" data-open="false" aria-label="Artifact bundle verifier">
        <div class="artifact-set-form">
          <span>Packet set check</span>
          <h2>Verify the full artifact bundle before accepting the packet.</h2>
          <p>Paste the downloaded artifact bundle JSON. The desk checks every markdown export against the current manifest and reports missing, duplicate, or edited artifacts.</p>
          <label>
            <span>Artifact bundle JSON</span>
            <textarea id="external-review-artifact-set-content" spellcheck="false" aria-label="Artifact bundle JSON" placeholder='Paste quick-external-review-artifact-bundle.json here.'></textarea>
          </label>
          <button class="primary" id="external-review-artifact-set-submit" type="button">Verify artifact bundle</button>
          <small class="status-line" id="external-review-artifact-set-status">Verify a packet manifest before checking a bundle.</small>
        </div>
        <div class="artifact-set-result" id="external-review-artifact-set-result" data-open="false" aria-live="polite">
          <span id="external-review-artifact-set-result-kicker">No bundle checked yet</span>
          <h3 id="external-review-artifact-set-result-title">Waiting for bundle</h3>
          <p id="external-review-artifact-set-result-summary">Paste an artifact bundle JSON export to compare every markdown file with the manifest.</p>
          <pre id="external-review-artifact-set-result-json">{}</pre>
        </div>
      </section>
      <section class="source-panel" id="external-review-packet-source" data-open="false" aria-label="Verified packet source">
        <div>
          <span class="eyebrow">Source receipts</span>
          <h2>Trace back before approval</h2>
          <ul class="receipt-list" id="external-review-packet-receipts"></ul>
        </div>
        <pre id="external-review-packet-json">{}</pre>
      </section>
    </main>
    <footer>External review packet verifier: ${escapeHtml(input.apiUrl)}</footer>
    <script type="application/json" id="external-review-packet-sample">${escapeScriptJson(sampleRequestJson)}</script>
    <script>
      (() => {
        const apiUrl = ${JSON.stringify(input.apiUrl)};
        const artifactApiUrl = ${JSON.stringify(input.artifactApiUrl)};
        const artifactSetApiUrl = ${JSON.stringify(input.artifactSetApiUrl)};
        const decisionApiUrl = ${JSON.stringify(input.decisionApiUrl)};
        const receiptVerifierUrl = ${JSON.stringify(input.links?.receiptVerifierUrl ?? "/receipt-verifier")};
        const appUrl = ${JSON.stringify(input.links?.appUrl ?? "/")};
        const packetShareParam = ${JSON.stringify(QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM)};
        const responseShareParam = ${JSON.stringify(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM)};
        const responseKeyParam = ${JSON.stringify(QUICK_EXTERNAL_REVIEW_RESPONSE_KEY_PARAM)};
        const autoVerify = ${JSON.stringify(input.autoVerify === true)};
        const storedRequestKey = ${JSON.stringify(input.storedRequestKey ?? "")};
        const textarea = document.getElementById("external-review-packet-input");
        const submit = document.getElementById("external-review-packet-submit");
        const reset = document.getElementById("external-review-packet-reset");
        const status = document.getElementById("external-review-packet-status");
        const memoPanel = document.getElementById("external-review-packet-memo");
        const testsPanel = document.getElementById("external-review-packet-tests");
        const artifactsPanel = document.getElementById("external-review-packet-artifacts");
        const artifactVerifier = document.getElementById("external-review-artifact-verifier");
        const artifactSelect = document.getElementById("external-review-artifact-select");
        const artifactContent = document.getElementById("external-review-artifact-content");
        const artifactSubmit = document.getElementById("external-review-artifact-submit");
        const artifactStatus = document.getElementById("external-review-artifact-status");
        const artifactResult = document.getElementById("external-review-artifact-result");
        const artifactResultKicker = document.getElementById("external-review-artifact-result-kicker");
        const artifactResultTitle = document.getElementById("external-review-artifact-result-title");
        const artifactResultSummary = document.getElementById("external-review-artifact-result-summary");
        const artifactResultJson = document.getElementById("external-review-artifact-result-json");
        const artifactSetVerifier = document.getElementById("external-review-artifact-set-verifier");
        const artifactSetContent = document.getElementById("external-review-artifact-set-content");
        const artifactSetSubmit = document.getElementById("external-review-artifact-set-submit");
        const artifactSetStatus = document.getElementById("external-review-artifact-set-status");
        const artifactSetResult = document.getElementById("external-review-artifact-set-result");
        const artifactSetResultKicker = document.getElementById("external-review-artifact-set-result-kicker");
        const artifactSetResultTitle = document.getElementById("external-review-artifact-set-result-title");
        const artifactSetResultSummary = document.getElementById("external-review-artifact-set-result-summary");
        const artifactSetResultJson = document.getElementById("external-review-artifact-set-result-json");
        const sourcePanel = document.getElementById("external-review-packet-source");
        const responsePanel = document.getElementById("external-review-response-panel");
        const responseSubmit = document.getElementById("external-review-response-submit");
        const responseReviewer = document.getElementById("external-review-response-reviewer");
        const responseNote = document.getElementById("external-review-response-note");
        const responseStatus = document.getElementById("external-review-response-status");
        const responseOutput = document.getElementById("external-review-response-output");
        const responseKicker = document.getElementById("external-review-response-kicker");
        const responseTitle = document.getElementById("external-review-response-title");
        const responseSummary = document.getElementById("external-review-response-summary");
        const responseJson = document.getElementById("external-review-response-json");
        const responseMarkdown = document.getElementById("external-review-response-markdown");
        const responseVerify = document.getElementById("external-review-response-verify");
        const responseWorkbench = document.getElementById("external-review-response-workbench");
        const stamp = document.getElementById("external-review-packet-stamp");
        const kicker = document.getElementById("external-review-packet-kicker");
        const title = document.getElementById("external-review-packet-title");
        const summary = document.getElementById("external-review-packet-summary");
        const rule = document.getElementById("external-review-packet-rule");
        const decision = document.getElementById("external-review-packet-decision");
        const confidence = document.getElementById("external-review-packet-confidence");
        const ready = document.getElementById("external-review-packet-ready");
        const receipt = document.getElementById("external-review-packet-receipt");
        const download = document.getElementById("external-review-packet-download");
        const receipts = document.getElementById("external-review-packet-receipts");
        const json = document.getElementById("external-review-packet-json");
        const sample = document.getElementById("external-review-packet-sample")?.textContent || "";
        if (!textarea || !submit || !reset || !status || !memoPanel || !testsPanel || !artifactsPanel || !artifactVerifier || !artifactSelect || !artifactContent || !artifactSubmit || !artifactStatus || !artifactResult || !artifactResultKicker || !artifactResultTitle || !artifactResultSummary || !artifactResultJson || !artifactSetVerifier || !artifactSetContent || !artifactSetSubmit || !artifactSetStatus || !artifactSetResult || !artifactSetResultKicker || !artifactSetResultTitle || !artifactSetResultSummary || !artifactSetResultJson || !sourcePanel || !responsePanel || !responseSubmit || !responseReviewer || !responseNote || !responseStatus || !responseOutput || !responseKicker || !responseTitle || !responseSummary || !responseJson || !responseMarkdown || !responseVerify || !responseWorkbench || !stamp || !kicker || !title || !summary || !rule || !decision || !confidence || !ready || !receipt || !download || !receipts || !json) return;

        let currentManifest = null;
        let currentMemo = null;
        let currentVerification = null;

        const storageKey = storedRequestKey ? "receipt-verifier-request:" + storedRequestKey : "";
        let storedRequest = "";
        if (storageKey) {
          try {
            storedRequest = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey) || "";
          } catch {
            storedRequest = "";
          }
          if (storedRequest) {
            textarea.value = storedRequest;
            status.textContent = autoVerify ? "Stored packet manifest loaded. Running verifier..." : "Stored packet manifest loaded.";
          } else {
            status.textContent = "Stored packet manifest was not found. Return to the packet and open Review desk again.";
          }
        }

        function isObject(value) {
          return !!value && typeof value === "object" && !Array.isArray(value);
        }

        function manifestFrom(value) {
          if (!isObject(value)) return null;
          if (isObject(value.manifest)) return value.manifest;
          if (isObject(value.payload)) return value.payload;
          return value;
        }

        function escapeHtmlClient(value) {
          return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function safeHref(value) {
          const href = String(value || "");
          if (href.startsWith("https://") || href.startsWith("http://") || href.startsWith("/") || href.startsWith("#")) return href;
          if (href.startsWith("data:text/") || href.startsWith("data:application/json")) return href;
          return "#";
        }

        function artifactAnchor(item) {
          const id = String(item?.id || "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
          return "external-review-artifact-" + (id || "unknown");
        }

        function artifact(manifest, id) {
          const items = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
          return items.find((item) => item && item.id === id);
        }

        function statusOf(value) {
          return value === "ready" || value === "watch" || value === "blocked" ? value : "blocked";
        }

        function canonicalize(value) {
          if (Array.isArray(value)) return value.map((item) => canonicalize(item));
          if (value && typeof value === "object") {
            return Object.fromEntries(
              Object.entries(value)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, item]) => [key, canonicalize(item)])
            );
          }
          return value;
        }

        function stablePacketHash(value) {
          let hash = 2166136261;
          for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
          }
          return (hash >>> 0).toString(16).padStart(8, "0");
        }

        function canonicalJson(value) {
          return JSON.stringify(canonicalize(value), null, 2);
        }

        function testFromArtifact(manifest, id, label, test) {
          const item = artifact(manifest, id);
          return {
            id,
            label,
            status: statusOf(item?.status),
            test,
            evidence: String(item?.evidence || "Artifact missing from the packet manifest."),
            href: safeHref(item?.href)
          };
        }

        function buildTests(manifest, body) {
          const verified = body?.verification?.status === "verified";
          const manifestId = String(manifest?.receiptId || "unknown manifest");
          const checksum = String(manifest?.checksum || "missing checksum");
          return [
            {
              id: "manifest-integrity",
              label: "Manifest verification",
              status: verified ? "ready" : "blocked",
              test: "Receipt checksum, payload checksum, receipt id, clearance, counts, and artifact order all verify.",
              evidence: manifestId + " / fnv1a32:" + checksum,
              href: "#external-review-packet-source"
            },
            testFromArtifact(manifest, "proof-freshness", "Proof freshness", "Live proof is inside the current external review window."),
            {
              id: "external-clearance",
              label: "External clearance",
              status: manifest?.clearance === "external-review" && manifest?.status === "ready" ? "ready" : "blocked",
              test: "Packet clearance allows the manifest to leave the internal workspace.",
              evidence: "clearance " + String(manifest?.clearance || "missing") + "; status " + String(manifest?.status || "missing"),
              href: safeHref(artifact(manifest, "launch-certificate")?.href)
            },
            testFromArtifact(manifest, "claim-audit", "Claim trace", "Decision claims have source, proof, owner, verification instruction, and risk."),
            testFromArtifact(manifest, "value-route", "Review-to-value route", "A continue decision has Day 0, 7, 14, and 30 owner proof."),
            testFromArtifact(manifest, "objection-answers", "Objection defense", "Likely reviewer objections are answered with evidence and owner accountability.")
          ];
        }

        function buildMemo(manifest, body) {
          const tests = buildTests(manifest, body);
          const verified = body?.verification?.status === "verified";
          const readyCount = tests.filter((item) => item.status === "ready").length;
          const totalCount = tests.length;
          const readyRatio = Math.round((readyCount / Math.max(1, totalCount)) * 100);
          const score = Number.isFinite(Number(manifest?.score)) ? Number(manifest.score) : 0;
          const confidenceScore = Math.max(0, Math.min(100, Math.round(((verified ? 100 : 0) + score + readyRatio) / 3)));
          const firstOpen = tests.find((item) => item.id === "proof-freshness" && item.status !== "ready") || tests.find((item) => item.status !== "ready");
          const allReady = verified && manifest?.status === "ready" && manifest?.clearance === "external-review" && tests.every((item) => item.status === "ready");
          const decisionId = allReady ? "accept-external-review" : verified && score >= 75 ? "hold-for-recheck" : "do-not-send";
          const reviewerOutcome =
            decisionId === "accept-external-review" ? "Accept for external review" : decisionId === "hold-for-recheck" ? "Hold internal until recheck" : "Do not send this packet";
          const headline =
            decisionId === "accept-external-review"
              ? "External reviewer can accept the packet"
              : decisionId === "hold-for-recheck"
                ? "Hold until " + (firstOpen?.label || "open evidence") + " closes"
                : "Current packet should not leave the room";
          const packetBuyer = String(manifest?.buyer || "Unknown buyer");
          const packetScore = String(Number.isFinite(score) ? score : 0);
          const packetSummary =
            decisionId === "accept-external-review"
              ? packetBuyer + " can verify the manifest, read the packet in order, and answer continue, revise, or stop from proof."
              : decisionId === "hold-for-recheck"
                ? readyCount + "/" + totalCount + " reviewer acceptance tests pass. Keep the packet internal; next: " + (firstOpen?.test || String(manifest?.nextAction || "recheck the packet"))
                : readyCount + "/" + totalCount + " reviewer acceptance tests pass and the launch score is " + packetScore + "/100. Repair the source packet before external review.";
          const decisionRule =
            decisionId === "accept-external-review"
              ? "Accept only after the verifier confirms the manifest and every memo test is ready."
              : decisionId === "hold-for-recheck"
                ? "Hold if any test is open; re-export only after the named owner closes the first hold."
                : "Do not send when launch score is below 75, verification fails, or the packet has unresolved source proof.";
          const nextAction = decisionId === "accept-external-review" ? String(manifest?.sendRule || "Send with verified packet manifest.") : firstOpen ? firstOpen.label + ": " + firstOpen.test : String(manifest?.nextAction || "Repair the packet.");
          const markdown = [
            "# External reviewer decision memo",
            "",
            "Buyer: " + packetBuyer,
            "Decision: " + reviewerOutcome,
            "Status: " + String(manifest?.status || "unknown"),
            "Confidence: " + confidenceScore + "/100",
            "Ready: " + readyCount + "/" + totalCount,
            "Manifest: " + String(manifest?.receiptId || "unknown"),
            "",
            "## Summary",
            packetSummary,
            "",
            "## Decision rule",
            decisionRule,
            "",
            "## Next action",
            nextAction,
            "",
            "## Acceptance tests",
            ...tests.map((item) => "- [" + item.status + "] " + item.label + ": " + item.test + " Evidence: " + item.evidence),
            "",
            "## Verifier response",
            JSON.stringify(body, null, 2)
          ].join("\\n");
          return { tests, readyCount, totalCount, confidenceScore, decisionId, reviewerOutcome, headline, summary: packetSummary, decisionRule, nextAction, markdown };
        }

        function selectedReviewerDecision() {
          const selected = document.querySelector('input[name="external-review-decision"]:checked');
          const value = selected?.value;
          return value === "continue" || value === "stop" ? value : "revise";
        }

        function responseStatusFor(reviewerDecision, memo) {
          if (reviewerDecision === "continue" && memo?.decisionId === "accept-external-review") return "ready";
          if (reviewerDecision === "stop") return "blocked";
          return "watch";
        }

        function responseLabelFor(reviewerDecision) {
          if (reviewerDecision === "continue") return "External review continue";
          if (reviewerDecision === "stop") return "External review stop";
          return "External review revision";
        }

        function responseNextActionFor(reviewerDecision, memo, manifest) {
          if (reviewerDecision === "continue") return memo?.decisionId === "accept-external-review" ? String(manifest?.sendRule || "Send with the verified packet manifest.") : "Do not continue until the open proof item is repaired and the packet is re-exported.";
          if (reviewerDecision === "stop") return "Stop external sharing and repair the packet before requesting another review.";
          return String(memo?.nextAction || manifest?.nextAction || "Repair the first open reviewer proof item.");
        }

        function buildResponseReceipt(manifest, memo, verification) {
          const reviewerDecision = selectedReviewerDecision();
          const reviewerName = String(responseReviewer.value || "External reviewer").trim() || "External reviewer";
          const reviewerNote = String(responseNote.value || memo?.nextAction || "Reviewer response recorded from the external review desk.").trim();
          const responseStatusValue = responseStatusFor(reviewerDecision, memo);
          const payload = {
            receiptVersion: "quick-external-review-decision.v1",
            decision: reviewerDecision,
            status: responseStatusValue,
            label: responseLabelFor(reviewerDecision),
            reviewerName,
            reviewerNote,
            buyer: String(manifest?.buyer || "Unknown buyer"),
            generatedAt: new Date().toISOString(),
            manifestReceiptId: String(manifest?.receiptId || "unknown"),
            manifestChecksum: "fnv1a32:" + String(manifest?.checksum || "00000000"),
            packetStatus: statusOf(manifest?.status),
            packetClearance: manifest?.clearance === "external-review" ? "external-review" : "internal-only",
            testsReady: Number(memo?.readyCount || 0),
            testsTotal: Number(memo?.totalCount || 1),
            confidence: Number(memo?.confidenceScore || 0),
            reviewOutcome: String(memo?.reviewerOutcome || "Review outcome unavailable"),
            nextAction: responseNextActionFor(reviewerDecision, memo, manifest),
            proof: "Packet verifier " + String(verification?.status || "unknown") + "; manifest " + String(manifest?.receiptId || "unknown") + "; " + String(memo?.readyCount || 0) + "/" + String(memo?.totalCount || 1) + " acceptance tests ready."
          };
          const checksum = stablePacketHash(canonicalJson(payload));
          return {
            checksum,
            payload
          };
        }

        function responseMarkdownFor(request, verifierBody) {
          const payload = request.payload;
          return [
            "# External review decision receipt",
            "",
            "Decision: " + payload.decision,
            "Status: " + payload.status,
            "Reviewer: " + payload.reviewerName,
            "Buyer: " + payload.buyer,
            "Manifest: " + payload.manifestReceiptId,
            "Checksum: fnv1a32:" + request.checksum,
            "",
            "## Reviewer note",
            payload.reviewerNote,
            "",
            "## Next action",
            payload.nextAction,
            "",
            "## Proof",
            payload.proof,
            "",
            "## Verifier response",
            JSON.stringify(verifierBody, null, 2)
          ].join("\\n");
        }

        function receiptVerifierHrefFor(requestJson) {
          const url = new URL(receiptVerifierUrl, window.location.href);
          url.searchParams.set("request", requestJson);
          url.searchParams.set("verify", "1");
          return url.toString();
        }

        function responseWorkbenchHrefFor(requestJson, checksum) {
          const key = String(checksum || stablePacketHash(requestJson));
          const storageKey = "quick-external-review-response:" + key;
          try {
            window.localStorage.setItem(storageKey, requestJson);
          } catch {
            // The URL carries a fallback copy when persistent storage is unavailable.
          }
          try {
            window.sessionStorage.setItem(storageKey, requestJson);
          } catch {
            // The URL carries a fallback copy when session storage is unavailable.
          }
          const url = new URL(appUrl || "/", window.location.href);
          const packetShare = new URL(window.location.href).searchParams.get(packetShareParam);
          if (packetShare) url.searchParams.set(packetShareParam, packetShare);
          url.searchParams.set(responseKeyParam, key);
          url.searchParams.set(responseShareParam, requestJson);
          url.hash = "quick-workflow-intake";
          return url.toString();
        }

        async function generateResponseReceipt() {
          if (!currentManifest || !currentMemo) {
            responseStatus.textContent = "Verify a packet before recording a response.";
            return;
          }
          responseSubmit.disabled = true;
          responseStatus.textContent = "Generating response receipt...";
          try {
            const request = buildResponseReceipt(currentManifest, currentMemo, currentVerification);
            const response = await fetch(decisionApiUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(request)
            });
            const body = await response.json();
            const requestJson = canonicalJson(request);
            const markdown = responseMarkdownFor(request, body);
            responseOutput.dataset.open = "true";
            responseKicker.textContent = "HTTP " + response.status + " / " + String(body?.verification?.status || body?.error || "invalid_request");
            responseTitle.textContent = body?.verification?.status === "verified" ? "Reviewer response receipt verified" : "Reviewer response needs review";
            responseSummary.textContent = request.payload.label + " / fnv1a32:" + request.checksum + " / " + request.payload.nextAction;
            responseJson.href = "data:application/json;charset=utf-8," + encodeURIComponent(requestJson);
            responseMarkdown.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown);
            responseVerify.href = receiptVerifierHrefFor(requestJson);
            responseWorkbench.href = responseWorkbenchHrefFor(requestJson, request.checksum);
            responseStatus.textContent = body?.verification?.status === "verified" ? "Response receipt verified." : "Response receipt did not verify.";
          } catch (error) {
            responseOutput.dataset.open = "true";
            responseKicker.textContent = "client_error";
            responseTitle.textContent = "Response receipt was not generated";
            responseSummary.textContent = error instanceof Error ? error.message : "The response receipt could not be generated.";
            responseStatus.textContent = "Response generation failed.";
          } finally {
            responseSubmit.disabled = false;
          }
        }

        function renderTests(tests) {
          testsPanel.innerHTML = tests
            .map((item) => {
              const href = safeHref(item.href);
              return '<article class="test-card ' + escapeHtmlClient(item.status) + '">' +
                '<span>' + escapeHtmlClient(item.label) + '</span>' +
                '<h3>' + escapeHtmlClient(item.test) + '</h3>' +
                '<p>' + escapeHtmlClient(item.evidence) + '</p>' +
                '<a href="' + escapeHtmlClient(href) + '">Open evidence</a>' +
                '</article>';
            })
            .join("");
          testsPanel.dataset.open = "true";
        }

        function renderArtifacts(manifest) {
          const items = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
          artifactsPanel.innerHTML = items
            .map((item) => {
              const status = statusOf(item?.status);
              const checksum = String(item?.contentChecksum || "missing");
              const contentKind = String(item?.contentKind || "markdown");
              const contentLength = Number.isFinite(Number(item?.contentLength)) ? Number(item.contentLength).toLocaleString("en-US") : "unknown";
              const order = Number.isFinite(Number(item?.requiredOrder)) ? String(item.requiredOrder) : "n/a";
              const href = safeHref(item?.href);
              const sourceLine = href && href !== "#" ? href : "No external source link in compact manifest.";
              return '<article class="artifact-card ' + escapeHtmlClient(status) + '" id="' + escapeHtmlClient(artifactAnchor(item)) + '">' +
                '<span>' + escapeHtmlClient("artifact " + order + " / " + status) + '</span>' +
                '<h3>' + escapeHtmlClient(item?.label || "Unnamed artifact") + '</h3>' +
                '<p>' + escapeHtmlClient(item?.evidence || "Evidence summary is missing from the packet manifest.") + '</p>' +
                '<dl>' +
                  '<div><dt>Role</dt><dd>' + escapeHtmlClient(item?.role || "unknown") + '</dd></div>' +
                  '<div><dt>Content</dt><dd>' + escapeHtmlClient(contentKind) + ' / ' + escapeHtmlClient(contentLength) + ' chars</dd></div>' +
                  '<div><dt>Content checksum</dt><dd>fnv1a32:' + escapeHtmlClient(checksum) + '</dd></div>' +
                  '<div><dt>Manifest link</dt><dd>' + escapeHtmlClient(sourceLine) + '</dd></div>' +
                  '<div><dt>Required order</dt><dd>' + escapeHtmlClient(order) + '</dd></div>' +
                '</dl>' +
                '</article>';
            })
            .join("");
          artifactsPanel.dataset.open = items.length ? "true" : "false";
        }

        function renderArtifactVerifier(manifest) {
          const items = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
          artifactSelect.innerHTML = items
            .map((item) => {
              const id = String(item?.id || "");
              const label = String(item?.label || id || "Artifact");
              const length = Number.isFinite(Number(item?.contentLength)) ? Number(item.contentLength).toLocaleString("en-US") : "unknown";
              return '<option value="' + escapeHtmlClient(id) + '">' + escapeHtmlClient(label + " (" + length + " chars)") + '</option>';
            })
            .join("");
          artifactVerifier.dataset.open = items.length ? "true" : "false";
          artifactStatus.textContent = items.length
            ? "Choose an artifact, paste its markdown export, and verify against the manifest."
            : "This manifest does not include artifact content checks.";
        }

        function renderArtifactSetVerifier(manifest) {
          const items = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
          artifactSetVerifier.dataset.open = items.length ? "true" : "false";
          artifactSetStatus.textContent = items.length
            ? "Paste the artifact bundle JSON from the source packet to verify the full set."
            : "This manifest does not include artifact content checks.";
        }

        function artifactsFromBundle(value) {
          const source = Array.isArray(value?.artifacts) ? value.artifacts : [];
          return source
            .map((item) => ({
              artifactId: String(item?.artifactId || item?.id || ""),
              content: String(item?.content || item?.markdown || "")
            }))
            .filter((item) => item.artifactId && item.content.trim());
        }

        async function verifyArtifactSet() {
          if (!currentManifest) {
            artifactSetStatus.textContent = "Verify a packet manifest before checking a bundle.";
            return;
          }
          let parsed = {};
          try {
            parsed = JSON.parse(String(artifactSetContent.value || "{}"));
          } catch (error) {
            artifactSetResult.dataset.open = "true";
            artifactSetResult.className = "artifact-set-result mismatch";
            artifactSetResultKicker.textContent = "client_parse_error";
            artifactSetResultTitle.textContent = "Artifact bundle JSON could not be parsed";
            artifactSetResultSummary.textContent = error instanceof Error ? error.message : "The bundle JSON could not be parsed.";
            artifactSetResultJson.textContent = "{}";
            artifactSetStatus.textContent = "Bundle JSON parse failed.";
            return;
          }
          const artifacts = artifactsFromBundle(parsed);
          if (!artifacts.length) {
            artifactSetStatus.textContent = "Paste a bundle with an artifacts array.";
            return;
          }

          artifactSetSubmit.disabled = true;
          artifactSetStatus.textContent = "Verifying artifact bundle...";
          try {
            const response = await fetch(artifactSetApiUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                manifest: currentManifest,
                artifacts
              })
            });
            const body = await response.json();
            const verification = body?.verification || {};
            const verified = verification.status === "verified";
            const duplicates = Array.isArray(verification.duplicateArtifactIds) && verification.duplicateArtifactIds.length
              ? " Duplicates: " + verification.duplicateArtifactIds.join(", ") + "."
              : "";
            artifactSetResult.dataset.open = "true";
            artifactSetResult.className = "artifact-set-result " + (verified ? "verified" : "mismatch");
            artifactSetResultKicker.textContent = "HTTP " + response.status + " / " + String(verification.status || body?.error || "invalid_request");
            artifactSetResultTitle.textContent = verified ? "All packet artifacts match manifest" : "Artifact bundle needs repair";
            artifactSetResultSummary.textContent = String(verification.instruction || "Artifact bundle verification finished.") +
              " Verified " + String(verification.verifiedCount ?? 0) + "/" + String(verification.expectedArtifactCount ?? "unknown") +
              "; missing " + String(verification.missingCount ?? 0) +
              "; mismatches " + String(verification.mismatchCount ?? 0) + "." +
              duplicates;
            artifactSetResultJson.textContent = JSON.stringify(body, null, 2);
            artifactSetStatus.textContent = verified ? "Artifact bundle verified." : "Artifact bundle mismatch.";
          } catch (error) {
            artifactSetResult.dataset.open = "true";
            artifactSetResult.className = "artifact-set-result mismatch";
            artifactSetResultKicker.textContent = "client_error";
            artifactSetResultTitle.textContent = "Artifact bundle could not be checked";
            artifactSetResultSummary.textContent = error instanceof Error ? error.message : "Artifact bundle verification failed.";
            artifactSetResultJson.textContent = "{}";
            artifactSetStatus.textContent = "Artifact bundle verification failed.";
          } finally {
            artifactSetContent.scrollTop = 0;
            artifactSetSubmit.disabled = false;
          }
        }

        async function verifyArtifactContent() {
          if (!currentManifest) {
            artifactStatus.textContent = "Verify a packet manifest before checking artifact content.";
            return;
          }
          const artifactId = String(artifactSelect.value || "");
          const content = String(artifactContent.value || "");
          if (!artifactId || !content.trim()) {
            artifactStatus.textContent = "Choose an artifact and paste its markdown content.";
            return;
          }

          artifactSubmit.disabled = true;
          artifactStatus.textContent = "Verifying artifact markdown...";
          try {
            const response = await fetch(artifactApiUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                manifest: currentManifest,
                artifactId,
                content
              })
            });
            const body = await response.json();
            const verification = body?.verification || {};
            const verified = verification.status === "verified";
            artifactResult.dataset.open = "true";
            artifactResult.className = "artifact-result " + (verified ? "verified" : "mismatch");
            artifactResultKicker.textContent = "HTTP " + response.status + " / " + String(verification.status || body?.error || "invalid_request");
            artifactResultTitle.textContent = verified ? "Artifact markdown matches manifest" : "Artifact markdown does not match";
            artifactResultSummary.textContent = String(verification.instruction || "Artifact verification finished.") +
              " Expected " + String(verification.expectedLength ?? "unknown") + " chars / fnv1a32:" + String(verification.expectedChecksum || "missing") +
              "; actual " + String(verification.actualLength ?? "unknown") + " chars / fnv1a32:" + String(verification.actualChecksum || "missing") + ".";
            artifactResultJson.textContent = JSON.stringify(body, null, 2);
            artifactStatus.textContent = verified ? "Artifact content verified." : "Artifact content mismatch.";
          } catch (error) {
            artifactResult.dataset.open = "true";
            artifactResult.className = "artifact-result mismatch";
            artifactResultKicker.textContent = "client_error";
            artifactResultTitle.textContent = "Artifact could not be checked";
            artifactResultSummary.textContent = error instanceof Error ? error.message : "Artifact verification failed.";
            artifactResultJson.textContent = "{}";
            artifactStatus.textContent = "Artifact verification failed.";
          } finally {
            artifactSubmit.disabled = false;
          }
        }

        function renderReceipts(manifest) {
          const items = Array.isArray(manifest?.sourceReceipts) ? manifest.sourceReceipts : [];
          receipts.innerHTML = items
            .map((item) => "<li><strong>" + escapeHtmlClient(item?.label || "Source") + "</strong><br />" + escapeHtmlClient(item?.value || "missing") + "</li>")
            .join("");
        }

        function render(body, httpStatus, manifest) {
          const memo = buildMemo(manifest, body);
          currentManifest = manifest;
          currentMemo = memo;
          currentVerification = body?.verification || null;
          memoPanel.dataset.open = "true";
          memoPanel.dataset.decision = memo.decisionId;
          responsePanel.dataset.open = "true";
          sourcePanel.dataset.open = "true";
          stamp.textContent = body?.verification?.status === "verified" ? "Verified" : "Hold";
          kicker.textContent = "HTTP " + httpStatus + " / " + String(body?.verification?.status || body?.error || "invalid_request");
          title.textContent = memo.headline;
          summary.textContent = memo.summary;
          rule.textContent = memo.decisionRule + " Next: " + memo.nextAction;
          decision.textContent = memo.reviewerOutcome;
          confidence.textContent = memo.confidenceScore + "/100";
          ready.textContent = memo.readyCount + "/" + memo.totalCount;
          receipt.textContent = String(manifest?.receiptId || "unknown");
          download.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(memo.markdown);
          const defaultDecision = memo.decisionId === "accept-external-review" ? "continue" : memo.decisionId === "do-not-send" ? "stop" : "revise";
          const defaultDecisionInput = document.querySelector('input[name="external-review-decision"][value="' + defaultDecision + '"]');
          if (defaultDecisionInput) defaultDecisionInput.checked = true;
          responseNote.value = memo.nextAction;
          responseStatus.textContent = "Packet verified. Record a reviewer response when ready.";
          renderTests(memo.tests);
          renderArtifacts(manifest);
          renderArtifactVerifier(manifest);
          renderArtifactSetVerifier(manifest);
          renderReceipts(manifest);
          json.textContent = JSON.stringify({ verifier: body, manifest }, null, 2);
        }

        submit.addEventListener("click", async () => {
          submit.disabled = true;
          status.textContent = "Verifying packet manifest...";
          try {
            const parsed = JSON.parse(textarea.value || "{}");
            const manifest = manifestFrom(parsed);
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(parsed)
            });
            const body = await response.json();
            render(body, response.status, manifest);
            status.textContent = body?.verification?.status === "verified" ? "Packet verified and memo rendered." : "Packet did not verify. Memo is in hold mode.";
          } catch (error) {
            render({
              error: "client_parse_error",
              verification: { status: "mismatch" },
              nextAction: error instanceof Error ? error.message : "The JSON could not be parsed."
            }, 0, {});
            status.textContent = "JSON parse failed.";
          } finally {
            submit.disabled = false;
          }
        });

        reset.addEventListener("click", () => {
          textarea.value = sample;
          status.textContent = "Loaded input restored.";
        });

        responseSubmit.addEventListener("click", () => {
          void generateResponseReceipt();
        });

        artifactSubmit.addEventListener("click", () => {
          void verifyArtifactContent();
        });

        artifactSetSubmit.addEventListener("click", () => {
          void verifyArtifactSet();
        });

        if (autoVerify && (!storedRequestKey || storedRequest)) {
          window.requestAnimationFrame(() => submit.click());
        }
      })();
    </script>
  </body>
</html>`;
}
