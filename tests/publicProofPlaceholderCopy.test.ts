import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "../src/publicProofUrl";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("public proof placeholder copy", () => {
  test("keeps source UI and report prompts free of demo proof domains", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((file) => readFileSync(file, "utf8").includes("proof.example.com"));

    expect(offenders).toEqual([]);
  });

  test("uses explicit public proof requirement tokens for homepage proof inputs", () => {
    const source = readFileSync(join(process.cwd(), "src/AppHome.tsx"), "utf8");
    const fieldsStart = source.indexOf("const BUYER_PILOT_PROOF_FIELDS");
    const fieldsEnd = source.indexOf("function isPublicProofUrl", fieldsStart);
    const fieldsSource = source.slice(fieldsStart, fieldsEnd);

    expect(fieldsStart).toBeGreaterThan(-1);
    expect(fieldsEnd).toBeGreaterThan(fieldsStart);
    expect(fieldsSource).toContain("PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl");
    expect(fieldsSource).toContain("PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl");
    expect(fieldsSource).toContain("PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl");
    expect(fieldsSource).toContain("PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl");
    expect(fieldsSource).toContain("PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl");
    expect(fieldsSource).not.toMatch(/service-xyz|your-service|your-cloud-run-url|docs\.google\.com\/\.\.\.|github\.com\/\.\.\.|https:\/\/[^\s"']*\.\.\./i);
  });

  test("keeps shared public proof input tokens required instead of fake URLs", () => {
    expect(Object.values(PUBLIC_PROOF_INPUT_PLACEHOLDERS)).toEqual(
      expect.arrayContaining([
        "<public Cloud Run product URL reviewers can open>",
        "<published ProtoPedia work URL>",
        "<public or unlisted walkthrough video URL>",
        "<public measured pilot receipt URL>",
        "<public work-order proof URL>"
      ])
    );
    for (const placeholder of Object.values(PUBLIC_PROOF_INPUT_PLACEHOLDERS)) {
      expect(placeholder).toMatch(/^<.+>$/);
      expect(placeholder).not.toMatch(/https:\/\/|example|your-service|your-company|your-cloud-run-url|\.\.\./i);
    }
  });
});
