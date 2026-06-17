import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const dirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function uniqueFileHashes(relativePath) {
  const hashes = new Map();
  for (const dir of dirs) {
    const path = join(outputsDir, dir, relativePath);
    const hash = hashFile(path);
    if (!hashes.has(hash)) hashes.set(hash, []);
    hashes.get(hash).push(dir);
  }
  return hashes;
}

function assertAllUnique(relativePath) {
  const hashes = uniqueFileHashes(relativePath);
  if (hashes.size !== dirs.length) {
    for (const [hash, owners] of hashes) {
      if (owners.length > 1) {
        fail(`${relativePath} hash ${hash.slice(0, 10)} is shared by ${owners.join(", ")}`);
      }
    }
  }
  console.log(`${relativePath}: ${hashes.size}/${dirs.length} unique`);
}

if (dirs.length !== 20) {
  fail(`Expected 20 output projects, found ${dirs.length}`);
}

assertAllUnique("src/main.ts");
assertAllUnique("src/styles.css");
assertAllUnique("src/agent.ts");

const architectureIds = new Set();
const layoutClasses = new Set();
const logicModels = new Set();

for (const dir of dirs) {
  const projectDir = join(outputsDir, dir);
  const main = readFileSync(join(projectDir, "src", "main.ts"), "utf8");
  const css = readFileSync(join(projectDir, "src", "styles.css"), "utf8");
  const agent = readFileSync(join(projectDir, "src", "agent.ts"), "utf8");
  const readme = readFileSync(join(projectDir, "README.md"), "utf8");

  const architecture = main.match(/"architectureId": "([^"]+)"/)?.[1];
  const layout = main.match(/"layoutClass": "([^"]+)"/)?.[1];
  const logic = agent.match(/"scoringModel": "([^"]+)"/)?.[1];

  if (!architecture) fail(`${dir} missing uiProfile architectureId`);
  if (!layout) fail(`${dir} missing uiProfile layoutClass`);
  if (!logic) fail(`${dir} missing logicProfile scoringModel`);
  if (architecture) architectureIds.add(architecture);
  if (layout) layoutClasses.add(layout);
  if (logic) logicModels.add(logic);

  const requiredMainMarkers = [
    "uiProfile",
    "stage-strip",
    "architecture-band",
    "localStorage",
    "copyText",
    "download-json",
    "hasGitHubCollection",
  ];
  for (const marker of requiredMainMarkers) {
    if (!main.includes(marker)) fail(`${dir} main.ts missing ${marker}`);
  }

  const requiredCssMarkers = [
    "focus-visible",
    "min-height: 44px",
    "@media (max-width: 780px)",
    "@media (prefers-reduced-motion: reduce)",
    "grid-template-columns",
  ];
  for (const marker of requiredCssMarkers) {
    if (!css.includes(marker)) fail(`${dir} styles.css missing ${marker}`);
  }

  const requiredLogicMarkers = [
    "logicProfile",
    "weightedMatches",
    "thresholdShift",
    "riskLexicon",
    "healthyLexicon",
    "actionTemplates",
    "automationPlan",
  ];
  for (const marker of requiredLogicMarkers) {
    if (!agent.includes(marker)) fail(`${dir} agent.ts missing ${marker}`);
  }

  if (!readme.includes("## Differentiated Product Architecture")) {
    fail(`${dir} README missing differentiated architecture section`);
  }
}

if (architectureIds.size !== 20) fail(`Expected 20 architecture IDs, found ${architectureIds.size}`);
if (layoutClasses.size !== 20) fail(`Expected 20 layout classes, found ${layoutClasses.size}`);
if (logicModels.size !== 20) fail(`Expected 20 logic models, found ${logicModels.size}`);

const auditPath = join(outputsDir, "UI_ARCHITECTURE_DIFFERENTIATION_AUDIT.md");
if (!existsSync(auditPath)) fail("Missing UI_ARCHITECTURE_DIFFERENTIATION_AUDIT.md");
const audit = readFileSync(auditPath, "utf8");
for (const architecture of architectureIds) {
  if (!audit.includes(architecture)) fail(`Audit missing architecture ${architecture}`);
}

if (!process.exitCode) {
  console.log("Differentiation verification passed for all 20 projects.");
}
