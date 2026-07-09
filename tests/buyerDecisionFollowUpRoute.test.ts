import { spawn, type ChildProcessByStdio } from "node:child_process";
import path from "node:path";
import type { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

type ServerProcess = ChildProcessByStdio<null, Readable, Readable>;

type BuyerDecisionFollowUpResponse = {
  status: string;
  mode: string;
  headline: string;
  readyCount: number;
  taskTotal: number;
  firstAction: {
    label: string;
    href: string;
  };
  tasks: Array<{
    id: string;
    owner: string;
    dueLabel: string;
    closeCondition: string;
    href: string;
  }>;
  escalationRules: string[];
  csv: string;
  receipt: {
    checksum: string;
    verificationApiPath: string;
    payload: unknown;
  };
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

describe("buyer decision follow-up public route", () => {
  const port = 19080 + Math.floor(Math.random() * 1000);
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

  test("publishes a sample follow-up ledger as JSON, HTML, Markdown, and CSV", async () => {
    const jsonResponse = await fetch(`http://127.0.0.1:${port}/api/buyer-decision-follow-up`);
    expect(jsonResponse.status).toBe(200);
    const ledger = (await jsonResponse.json()) as BuyerDecisionFollowUpResponse;

    expect(ledger.headline).toMatch(/external send|ready|review/i);
    expect(ledger.taskTotal).toBe(4);
    expect(ledger.tasks.map((task) => task.id)).toEqual(["decision-request", "commercial-boundary", "proof-trust", "stop-rule"]);
    expect(ledger.tasks.every((task) => task.owner.length > 0 && task.closeCondition.length > 0)).toBe(true);
    expect(ledger.csv).toContain("closeCondition");
    expect(ledger.receipt.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(ledger.receipt.verificationApiPath).toBe("/api/buyer-decision-follow-up/receipt/verify");
    expect(ledger.escalationRules.length).toBeGreaterThanOrEqual(3);

    const htmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-decision-follow-up`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();
    expect(html).toContain("Buyer decision follow-up ledger");
    expect(html).toContain("/api/buyer-decision-follow-up?brief=");
    expect(html).toContain("/buyer-decision-follow-up.csv?brief=");
    expect(html).toContain("/api/buyer-decision-follow-up/receipt/verify");
    expect(html).toContain("Verify receipt");

    const markdownResponse = await fetch(`http://127.0.0.1:${port}/buyer-decision-follow-up.md`);
    expect(markdownResponse.status).toBe(200);
    expect(await markdownResponse.text()).toContain("## CSV ledger");

    const csvResponse = await fetch(`http://127.0.0.1:${port}/buyer-decision-follow-up.csv`);
    expect(csvResponse.status).toBe(200);
    expect(await csvResponse.text()).toContain("taskId,label,status,owner,due,nextStep,closeCondition,evidence,href");

    const verifyResponse = await fetch(`http://127.0.0.1:${port}${ledger.receipt.verificationApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checksum: ledger.receipt.checksum,
        payload: ledger.receipt.payload
      })
    });
    expect(verifyResponse.status).toBe(200);
    expect(await verifyResponse.json()).toMatchObject({
      skill: "buyer-decision-follow-up.receipt.verify",
      verification: {
        status: "verified",
        actualChecksum: ledger.receipt.checksum
      }
    });
  });

  test("preserves explicit workspace query parameters in follow-up artifact links", async () => {
    const params = new URLSearchParams({
      brief: "Custom buyer follow-up",
      workOrder: "Custom operator handoff",
      workOrderTargetUser: "Procurement owner"
    });
    const response = await fetch(`http://127.0.0.1:${port}/api/buyer-decision-follow-up?${params.toString()}`);
    expect(response.status).toBe(200);
    const ledger = (await response.json()) as BuyerDecisionFollowUpResponse;

    expect(ledger.tasks[0]?.owner).toBe("Procurement owner");
    expect(ledger.firstAction.href).toContain("brief=Custom+buyer+follow-up");
    expect(ledger.firstAction.href).toContain("workOrder=Custom+operator+handoff");
    expect(ledger.firstAction.href).toContain("workOrderTargetUser=Procurement+owner");
  });
});
