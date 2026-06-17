import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const manifestPath = join(outputsDir, "manifest.json");
const runTerraform = process.argv.includes("--terraform");
const runPlanSmoke = process.argv.includes("--plan-smoke");
const writeAudit = process.argv.includes("--write-audit");

const evidence = [];
const failures = [];

function record(status, item, detail) {
  evidence.push({ status, item, detail });
  const mark = status === "PASS" ? "PASS" : "FAIL";
  console.log(`${mark} ${item}${detail ? `: ${detail}` : ""}`);
  if (status !== "PASS") failures.push(`${item}${detail ? `: ${detail}` : ""}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function requireFile(path, label) {
  if (existsSync(path)) {
    record("PASS", label, path);
    return true;
  }
  record("FAIL", label, `${path} is missing`);
  return false;
}

function contains(path, needles, label) {
  if (!existsSync(path)) {
    record("FAIL", label, `${path} is missing`);
    return;
  }
  const text = read(path);
  const missing = needles.filter((needle) => !text.includes(needle));
  if (missing.length === 0) record("PASS", label, path);
  else record("FAIL", label, `missing ${missing.join(", ")} in ${path}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    return { ok: false, output };
  }
  return { ok: true, output: `${result.stdout || ""}${result.stderr || ""}`.trim() };
}

function cleanupTerraformDirs() {
  for (const project of manifest.projects) {
    const dir = join(root, project.path, "infra/terraform/.terraform");
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
}

if (!existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(read(manifestPath));
const projects = manifest.projects || [];

record(projects.length === 20 ? "PASS" : "FAIL", "manifest project count", `${projects.length}`);

contains(
  join(root, "docs/01_hackathon/devops_ai_agent_hackathon_notion.md"),
  [
    "Google Cloud アプリケーション実行プロダクト",
    "Cloud Run",
    "Google Cloud AI 技術",
    "GitHubリポジトリのURL",
    "デプロイしたプロジェクトのURL",
    "システムアーキテクチャ図",
  ],
  "local hackathon requirement evidence",
);

for (const project of projects) {
  const prefix = project.slug;
  const projectRoot = join(root, project.path);
  const requiredFiles = [
    "README.md",
    "Dockerfile",
    ".env.example",
    ".github/workflows/ci.yml",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "docs/manual.html",
    "docs/development.html",
    "docs/environment.md",
    "docs/runbook.md",
    "docs/product.md",
    "docs/terraform.md",
    "docs/terraform.html",
    "docs/architecture.svg",
    "infra/terraform/versions.tf",
    "infra/terraform/main.tf",
    "infra/terraform/variables.tf",
    "infra/terraform/outputs.tf",
    "infra/terraform/terraform.tfvars.example",
    "infra/terraform/README.md",
    "infra/terraform/.terraform.lock.hcl",
  ];

  const missing = requiredFiles.filter((file) => !existsSync(join(projectRoot, file)));
  record(missing.length === 0 ? "PASS" : "FAIL", `${prefix} required files`, missing.length ? missing.join(", ") : "all present");

  contains(
    join(projectRoot, "README.md"),
    ["Terraform / Cloud Run IaC", "./docs/terraform.md", "./docs/terraform.html", "./docs/architecture.svg"],
    `${prefix} README deploy docs`,
  );
  contains(
    join(projectRoot, "docs/terraform.md"),
    ["terraform init", "terraform apply", "terraform output -raw service_url", "Gemini API", "Cloud Run"],
    `${prefix} Terraform markdown guide`,
  );
  contains(
    join(projectRoot, "docs/terraform.html"),
    ["architecture.svg", "terraform apply", "Cloud Run", "Gemini"],
    `${prefix} Terraform HTML guide`,
  );
  contains(join(projectRoot, "docs/architecture.svg"), ["<svg", "Cloud Run", "Terraform", "Gemini API"], `${prefix} SVG diagram`);
  contains(join(projectRoot, "docs/manual.html"), ["<svg", project.name], `${prefix} manual HTML diagram`);
  contains(join(projectRoot, "docs/development.html"), ["<svg", "/api/health", "/api/ready"], `${prefix} development HTML diagram`);
  contains(
    join(projectRoot, "infra/terraform/main.tf"),
    [
      "google_cloud_run_v2_service",
      "google_artifact_registry_repository",
      "terraform_data",
      "google_secret_manager_secret",
      "gcloud builds submit",
      "GEMINI_MODEL",
    ],
    `${prefix} Terraform Cloud Run resources`,
  );
}

if (runTerraform) {
  const fmt = run("terraform", ["fmt", "-check", "-recursive", "outputs"]);
  record(fmt.ok ? "PASS" : "FAIL", "terraform fmt -check -recursive outputs", fmt.ok ? "formatted" : fmt.output);

  const cacheDir = "/tmp/terraform-plugin-cache";
  spawnSync("mkdir", ["-p", cacheDir], { encoding: "utf8" });
  for (const project of projects) {
    const tfDir = `${project.path}/infra/terraform`;
    const init = run("terraform", ["-chdir=" + tfDir, "init", "-backend=false", "-input=false"], {
      env: { TF_PLUGIN_CACHE_DIR: cacheDir },
    });
    record(init.ok ? "PASS" : "FAIL", `${project.slug} terraform init`, init.ok ? "initialized" : init.output);
    if (!init.ok) continue;
    const validate = run("terraform", ["-chdir=" + tfDir, "validate"]);
    record(validate.ok ? "PASS" : "FAIL", `${project.slug} terraform validate`, validate.ok ? "valid" : validate.output);

    if (runPlanSmoke && validate.ok) {
      const planPath = `/tmp/${project.slug}.tfplan`;
      const plan = run("terraform", [
        "-chdir=" + tfDir,
        "plan",
        "-refresh=false",
        "-input=false",
        "-var",
        "project_id=dummy-project-for-validation",
        "-out=" + planPath,
      ]);
      record(plan.ok ? "PASS" : "FAIL", `${project.slug} terraform plan smoke`, plan.ok ? "planned without apply" : plan.output);
      if (existsSync(planPath)) rmSync(planPath, { force: true });
    }
  }
  cleanupTerraformDirs();
}

if (writeAudit) {
  const lines = [
    "# Terraform Deployment Audit 2026-05-26",
    "",
    "This audit was generated from the current worktree by `scripts/verify_hackathon_readiness.mjs`.",
    "",
    "## Result",
    "",
    failures.length === 0 ? "PASS: all checked hackathon deployment and documentation requirements passed." : `FAIL: ${failures.length} check(s) failed.`,
    "",
    runPlanSmoke
      ? "Plan smoke used a placeholder project ID and non-applying Terraform plans. Cloud Build provisioners were planned but not executed, and no Google Cloud resources were created."
      : "",
    "",
    "## Evidence",
    "",
    ...evidence.map((item) => `- ${item.status}: ${item.item}${item.detail ? ` - ${item.detail}` : ""}`),
    "",
  ];
  writeFileSync(join(outputsDir, "TERRAFORM_DEPLOYMENT_AUDIT_2026-05-26.md"), lines.join("\n"), "utf8");
}

if (failures.length > 0) {
  console.error(`\n${failures.length} readiness check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${projects.length} projects passed hackathon readiness checks.`);
