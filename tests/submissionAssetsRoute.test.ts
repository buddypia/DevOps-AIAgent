import { spawn, type ChildProcessByStdio } from "node:child_process";
import path from "node:path";
import type { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

type ServerProcess = ChildProcessByStdio<null, Readable, Readable>;

type SubmissionAssetsResponse = {
  jsonEndpoint: string;
  proofReadiness: {
    readyCount: number;
    totalCount: number;
  };
  evidenceChain: Array<{
    id: string;
    url: string;
    command: string;
  }>;
  claimProofMatrix: Array<{
    id: string;
    proofUrl: string;
    status: string;
  }>;
};

function tsxBin() {
  return path.resolve(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
}

function waitForServer(child: ServerProcess, port: number) {
  return new Promise<void>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      finish(new Error(`server did not start on ${port}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 15000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      if (stdout.includes(`http://127.0.0.1:${port}`)) finish();
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("exit", (code) => {
      finish(new Error(`server exited before ready with code ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    });
  });
}

describe("submission assets public route", () => {
  const port = 20080 + Math.floor(Math.random() * 1000);
  let server: ServerProcess | undefined;

  beforeAll(async () => {
    const child = spawn(tsxBin(), ["server/index.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"]
    });
    server = child;
    await waitForServer(child, port);
  }, 20000);

  afterAll(async () => {
    if (!server || server.killed) return;
    await new Promise<void>((resolve) => {
      server?.once("exit", () => resolve());
      server?.kill("SIGTERM");
      setTimeout(resolve, 1000);
    });
  });

  test("publishes the submission room as human HTML and machine-readable JSON", async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const json = await fetch(`${baseUrl}/api/submission-assets`);
    expect(json.status).toBe(200);
    expect(json.headers.get("content-type")).toContain("application/json");
    const page = (await json.json()) as SubmissionAssetsResponse;

    expect(page.jsonEndpoint).toBe(`${baseUrl}/api/submission-assets`);
    expect(page.proofReadiness).toMatchObject({ readyCount: 5, totalCount: 7 });
    expect(page.claimProofMatrix.map((item) => item.id)).toEqual(
      expect.arrayContaining(["ai-agent-centrality", "practical-value", "implementation"])
    );
    expect(page.claimProofMatrix.find((item) => item.id === "implementation")).toMatchObject({
      proofUrl: `${baseUrl}/api/submission-assets`,
      status: "proven"
    });
    expect(page.evidenceChain.map((item) => item.id)).toEqual(expect.arrayContaining(["agent-card", "submission-assets-json"]));
    expect(page.evidenceChain.find((item) => item.id === "submission-assets-json")).toMatchObject({
      url: `${baseUrl}/api/submission-assets`,
      command: `curl -s ${baseUrl}/api/submission-assets`
    });

    const html = await fetch(`${baseUrl}/submission-assets`);
    expect(html.status).toBe(200);
    const htmlText = await html.text();
    expect(htmlText).toContain("Machine-readable JSON");
    expect(htmlText).toContain("Claim-To-Proof Matrix");
    expect(htmlText).toContain(`${baseUrl}/api/submission-assets`);
    expect(htmlText).toContain("Live Evidence Chain");
  });
});
