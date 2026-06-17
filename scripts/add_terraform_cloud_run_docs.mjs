import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const projectDirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

function writeText(filePath, text) {
  writeFileSync(filePath, text.replace(/\n+$/, "\n"), "utf8");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseProject(projectPath) {
  const source = readFileSync(projectPath, "utf8");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("} as const");
  if (start === -1 || end === -1) {
    throw new Error(`Cannot parse project config: ${projectPath}`);
  }
  return JSON.parse(source.slice(start, end + 1));
}

function safeAccountId(project) {
  const base = `sa-${String(project.rank).padStart(2, "0")}-${project.packageName}`.slice(0, 30);
  return base.replace(/-+$/g, "").padEnd(6, "0");
}

function list(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function htmlList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
}

function architectureSvg(project) {
  const accent = escapeHtml(project.accent);
  const secondary = escapeHtml(project.secondary);
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc" viewBox="0 0 1200 520">
  <title id="title">${escapeHtml(project.name)} Cloud Run Terraform Architecture</title>
  <desc id="desc">Terraform provisions Google Cloud APIs, Artifact Registry, Cloud Build image build, Secret Manager, a runtime service account, and a Cloud Run service that calls Gemini API.</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="#53606d"/>
    </marker>
    <linearGradient id="header" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${secondary}"/>
    </linearGradient>
    <style>
      .bg { fill: #f8fafc; }
      .band { fill: url(#header); }
      .card { fill: #ffffff; stroke: #cbd5e1; stroke-width: 2; }
      .primary { stroke: ${accent}; stroke-width: 3; }
      .title { font: 800 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #ffffff; }
      .subtitle { font: 600 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #e5eef8; }
      .label { font: 800 19px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #17202a; }
      .small { font: 600 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #53606d; }
      .tiny { font: 600 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #53606d; }
      .arrow { stroke: #53606d; stroke-width: 3; fill: none; marker-end: url(#arrow); }
    </style>
  </defs>
  <rect class="bg" width="1200" height="520" rx="18"/>
  <rect class="band" width="1200" height="112" rx="18"/>
  <text class="title" x="40" y="48">${escapeHtml(project.name)}</text>
  <text class="subtitle" x="40" y="78">Terraform deploys ${escapeHtml(project.packageName)} to Cloud Run with Gemini-ready configuration</text>

  <rect class="card primary" x="40" y="164" width="190" height="112" rx="10"/>
  <text class="label" x="135" y="205" text-anchor="middle">Developer</text>
  <text class="small" x="135" y="232" text-anchor="middle">terraform apply</text>
  <text class="tiny" x="135" y="253" text-anchor="middle">gcloud auth + project id</text>

  <path class="arrow" d="M232 220 H300"/>
  <rect class="card primary" x="306" y="146" width="220" height="148" rx="10"/>
  <text class="label" x="416" y="186" text-anchor="middle">Terraform</text>
  <text class="small" x="416" y="213" text-anchor="middle">enables APIs</text>
  <text class="small" x="416" y="236" text-anchor="middle">creates IAM and service</text>
  <text class="tiny" x="416" y="259" text-anchor="middle">infra/terraform</text>

  <path class="arrow" d="M528 194 H604"/>
  <rect class="card" x="610" y="136" width="220" height="112" rx="10"/>
  <text class="label" x="720" y="176" text-anchor="middle">Artifact Registry</text>
  <text class="small" x="720" y="202" text-anchor="middle">Docker repository</text>
  <text class="tiny" x="720" y="224" text-anchor="middle">${escapeHtml(project.packageName)}</text>

  <path class="arrow" d="M528 252 H604"/>
  <rect class="card" x="610" y="274" width="220" height="112" rx="10"/>
  <text class="label" x="720" y="314" text-anchor="middle">Cloud Build</text>
  <text class="small" x="720" y="340" text-anchor="middle">builds Dockerfile</text>
  <text class="tiny" x="720" y="362" text-anchor="middle">source_revision controls rebuild</text>

  <path class="arrow" d="M832 220 H902"/>
  <rect class="card primary" x="908" y="152" width="240" height="136" rx="10"/>
  <text class="label" x="1028" y="192" text-anchor="middle">Cloud Run</text>
  <text class="small" x="1028" y="220" text-anchor="middle">Express API + Vite UI</text>
  <text class="small" x="1028" y="244" text-anchor="middle">/api/health and /api/ready</text>
  <text class="tiny" x="1028" y="266" text-anchor="middle">${escapeHtml(project.positive)} / ${escapeHtml(project.caution)} / ${escapeHtml(project.negative)}</text>

  <path class="arrow" d="M1028 290 V352"/>
  <rect class="card" x="908" y="364" width="240" height="96" rx="10"/>
  <text class="label" x="1028" y="402" text-anchor="middle">Gemini API</text>
  <text class="small" x="1028" y="428" text-anchor="middle">via @google/genai</text>
  <text class="tiny" x="1028" y="448" text-anchor="middle">fallback works without key</text>

  <rect class="card" x="306" y="340" width="220" height="96" rx="10"/>
  <text class="label" x="416" y="378" text-anchor="middle">Secret Manager</text>
  <text class="small" x="416" y="404" text-anchor="middle">optional Gemini key</text>
  <text class="tiny" x="416" y="424" text-anchor="middle">optional API auth token</text>
  <path class="arrow" d="M528 388 H902"/>

  <text class="tiny" x="40" y="492">Hackathon fit: Cloud Run application runtime, Google Cloud AI through Gemini, GitHub-ready repository URL, deployed URL, and ProtoPedia system diagram.</text>
</svg>
`;
}

function versionsTf() {
  return `terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
  }
}
`;
}

function variablesTf(project) {
  return `variable "project_id" {
  description = "Google Cloud project ID where the hackathon app will be deployed."
  type        = string

  validation {
    condition     = length(var.project_id) > 0
    error_message = "project_id is required."
  }
}

variable "region" {
  description = "Google Cloud region for Cloud Run, Cloud Build, and Artifact Registry."
  type        = string
  default     = "asia-northeast1"
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
  default     = "${project.packageName}"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$", var.service_name))
    error_message = "service_name must be a valid Cloud Run service name."
  }
}

variable "repository_id" {
  description = "Artifact Registry Docker repository ID."
  type        = string
  default     = "${project.packageName}-repo"
}

variable "runtime_service_account_id" {
  description = "Service account ID used by the Cloud Run revision."
  type        = string
  default     = "${safeAccountId(project)}"
}

variable "image" {
  description = "Optional prebuilt container image. Leave empty to let Terraform run Cloud Build."
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Tag used when Terraform builds the image with Cloud Build."
  type        = string
  default     = "hackathon"
}

variable "source_revision" {
  description = "Change this value, for example to a git SHA or timestamp, to force Cloud Build to rebuild."
  type        = string
  default     = "manual"
}

variable "build_image_with_cloud_build" {
  description = "When true, Terraform runs gcloud builds submit before creating the Cloud Run service."
  type        = bool
  default     = true
}

variable "gemini_model" {
  description = "Gemini model ID exposed to the application."
  type        = string
  default     = "gemini-3.1-flash-lite"
}

variable "gemini_api_key" {
  description = "Optional Gemini API key. If set, Terraform stores it in Secret Manager. Prefer an existing secret for long-lived environments because secret values are stored in Terraform state."
  type        = string
  default     = ""
  sensitive   = true
}

variable "gemini_api_secret_id" {
  description = "Secret Manager secret ID to create when gemini_api_key is provided."
  type        = string
  default     = "${project.packageName}-gemini-api-key"
}

variable "existing_gemini_api_secret_id" {
  description = "Existing Secret Manager secret ID containing a latest version with the Gemini API key."
  type        = string
  default     = ""
}

variable "api_auth_token" {
  description = "Optional API auth token for protected POST endpoints. If set, Terraform stores it in Secret Manager."
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_auth_secret_id" {
  description = "Secret Manager secret ID for api_auth_token."
  type        = string
  default     = "${project.packageName}-api-auth-token"
}

variable "allow_unauthenticated" {
  description = "Grant allUsers roles/run.invoker for public hackathon demos."
  type        = bool
  default     = true
}

variable "allow_unauthenticated_api" {
  description = "Allow protected POST APIs without API_AUTH_TOKEN. Keep true for public judging demos, false for production."
  type        = bool
  default     = true
}

variable "require_gemini" {
  description = "When true, /api/ready fails unless a Gemini API key is configured."
  type        = bool
  default     = false
}

variable "cors_origin" {
  description = "Comma-separated allowed CORS origins. Use the deployed service URL for locked-down production."
  type        = string
  default     = "*"
}

variable "allow_wildcard_cors" {
  description = "Allow wildcard CORS in production for hackathon demo convenience."
  type        = bool
  default     = true
}

variable "json_body_limit" {
  description = "Express JSON body limit."
  type        = string
  default     = "1mb"
}

variable "rate_limit_window_ms" {
  description = "Rate limit window for protected AI/API surfaces."
  type        = number
  default     = 60000
}

variable "rate_limit_max_requests" {
  description = "Maximum protected requests per window."
  type        = number
  default     = 30
}

variable "min_instance_count" {
  description = "Minimum Cloud Run instances."
  type        = number
  default     = 0
}

variable "max_instance_count" {
  description = "Maximum Cloud Run instances."
  type        = number
  default     = 3
}

variable "cpu" {
  description = "Cloud Run CPU limit."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Cloud Run memory limit."
  type        = string
  default     = "512Mi"
}

variable "ingress" {
  description = "Cloud Run ingress setting."
  type        = string
  default     = "INGRESS_TRAFFIC_ALL"
}

variable "deletion_protection" {
  description = "Enable Cloud Run deletion protection."
  type        = bool
  default     = false
}

variable "service_version" {
  description = "Application service version exposed by /api/version."
  type        = string
  default     = "terraform"
}

variable "extra_env_vars" {
  description = "Additional non-secret environment variables for Cloud Run."
  type        = map(string)
  default     = {}
}

variable "labels" {
  description = "Additional resource labels."
  type        = map(string)
  default     = {}
}
`;
}

function mainTf(project) {
  return `provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  source_dir                     = abspath("\${path.module}/../..")
  container_image                = var.image != "" ? var.image : "\${var.region}-docker.pkg.dev/\${var.project_id}/\${var.repository_id}/\${var.service_name}:\${var.image_tag}"
  managed_gemini_secret_enabled = var.gemini_api_key != "" && var.existing_gemini_api_secret_id == ""
  active_gemini_secret_id       = var.existing_gemini_api_secret_id != "" ? var.existing_gemini_api_secret_id : (local.managed_gemini_secret_enabled ? var.gemini_api_secret_id : "")
  api_auth_secret_enabled       = var.api_auth_token != ""

  env_vars = merge(
    {
      NODE_ENV                = "production"
      GEMINI_MODEL            = var.gemini_model
      SERVICE_VERSION         = var.service_version
      REQUIRE_GEMINI          = tostring(var.require_gemini)
      ALLOW_UNAUTHENTICATED   = tostring(var.allow_unauthenticated_api)
      CORS_ORIGIN             = var.cors_origin
      ALLOW_WILDCARD_CORS     = tostring(var.allow_wildcard_cors)
      JSON_BODY_LIMIT         = var.json_body_limit
      RATE_LIMIT_WINDOW_MS    = tostring(var.rate_limit_window_ms)
      RATE_LIMIT_MAX_REQUESTS = tostring(var.rate_limit_max_requests)
    },
    var.extra_env_vars,
  )

  labels = merge(
    {
      app        = var.service_name
      hackathon  = "devops-ai-agent"
      managed_by = "terraform"
      rank       = "${String(project.rank).padStart(2, "0")}"
    },
    var.labels,
  )
}

resource "google_project_service" "required" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "app" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "Docker images for ${project.name}."
  format        = "DOCKER"
  labels        = local.labels

  depends_on = [google_project_service.required]
}

resource "terraform_data" "cloud_build" {
  count = var.build_image_with_cloud_build && var.image == "" ? 1 : 0

  input = {
    image           = local.container_image
    source_revision = var.source_revision
  }

  provisioner "local-exec" {
    command = "gcloud builds submit \${local.source_dir} --tag \${local.container_image} --project \${var.project_id} --quiet"
  }

  depends_on = [
    google_artifact_registry_repository.app,
    google_project_service.required,
  ]
}

resource "google_service_account" "runtime" {
  project      = var.project_id
  account_id   = var.runtime_service_account_id
  display_name = "${project.name} Cloud Run runtime"
  description  = "Runtime identity for the ${project.name} hackathon Cloud Run service."

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret" "gemini_api_key" {
  count = local.managed_gemini_secret_enabled ? 1 : 0

  project   = var.project_id
  secret_id = var.gemini_api_secret_id
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  count = local.managed_gemini_secret_enabled ? 1 : 0

  secret      = google_secret_manager_secret.gemini_api_key[0].id
  secret_data = var.gemini_api_key
}

resource "google_secret_manager_secret" "api_auth_token" {
  count = local.api_auth_secret_enabled ? 1 : 0

  project   = var.project_id
  secret_id = var.api_auth_secret_id
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "api_auth_token" {
  count = local.api_auth_secret_enabled ? 1 : 0

  secret      = google_secret_manager_secret.api_auth_token[0].id
  secret_data = var.api_auth_token
}

resource "google_secret_manager_secret_iam_member" "gemini_access" {
  count = local.active_gemini_secret_id != "" ? 1 : 0

  project   = var.project_id
  secret_id = local.active_gemini_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:\${google_service_account.runtime.email}"

  depends_on = [
    google_secret_manager_secret.gemini_api_key,
    google_secret_manager_secret_version.gemini_api_key,
  ]
}

resource "google_secret_manager_secret_iam_member" "api_auth_access" {
  count = local.api_auth_secret_enabled ? 1 : 0

  project   = var.project_id
  secret_id = var.api_auth_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:\${google_service_account.runtime.email}"

  depends_on = [
    google_secret_manager_secret.api_auth_token,
    google_secret_manager_secret_version.api_auth_token,
  ]
}

resource "google_cloud_run_v2_service" "app" {
  project             = var.project_id
  name                = var.service_name
  location            = var.region
  ingress             = var.ingress
  deletion_protection = var.deletion_protection
  labels              = local.labels

  template {
    service_account = google_service_account.runtime.email
    labels          = local.labels

    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }

    containers {
      image = local.container_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      startup_probe {
        http_get {
          path = "/api/health"
        }
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 12
      }

      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.active_gemini_secret_id == "" ? [] : [local.active_gemini_secret_id]
        content {
          name = "GEMINI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = local.api_auth_secret_enabled ? [var.api_auth_secret_id] : []
        content {
          name = "API_AUTH_TOKEN"
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    terraform_data.cloud_build,
    google_secret_manager_secret_iam_member.gemini_access,
    google_secret_manager_secret_iam_member.api_auth_access,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = google_cloud_run_v2_service.app.location
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
`;
}

function outputsTf() {
  return `output "service_name" {
  description = "Cloud Run service name."
  value       = google_cloud_run_v2_service.app.name
}

output "service_url" {
  description = "Deployed Cloud Run URL to submit to the hackathon form."
  value       = google_cloud_run_v2_service.app.uri
}

output "health_url" {
  description = "Health endpoint for smoke verification."
  value       = "\${google_cloud_run_v2_service.app.uri}/api/health"
}

output "ready_url" {
  description = "Readiness endpoint for smoke verification."
  value       = "\${google_cloud_run_v2_service.app.uri}/api/ready"
}

output "container_image" {
  description = "Container image deployed to Cloud Run."
  value       = local.container_image
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository resource."
  value       = google_artifact_registry_repository.app.id
}

output "runtime_service_account_email" {
  description = "Cloud Run runtime service account."
  value       = google_service_account.runtime.email
}
`;
}

function tfvarsExample(project) {
  return `# Copy this file to terraform.tfvars and set your real Google Cloud project.
project_id = "your-gcp-project-id"
region     = "asia-northeast1"

# Defaults are already project-specific.
service_name  = "${project.packageName}"
repository_id = "${project.packageName}-repo"
image_tag     = "hackathon"

# Change this on each redeploy so Terraform reruns Cloud Build.
source_revision = "manual"

# For public judging demos, fallback analysis works without a key.
# For Gemini-backed judging, prefer an existing Secret Manager secret:
# existing_gemini_api_secret_id = "${project.packageName}-gemini-api-key"
# require_gemini                = true
#
# Quick demo alternative, less ideal for long-lived state because the secret
# value is stored in Terraform state:
# gemini_api_key = "..."
`;
}

function terraformReadme(project) {
  return `# Terraform: ${project.name}

This directory deploys ${project.name} to Google Cloud Run for the DevOps x AI Agent Hackathon.

## What Terraform Creates

- Required Google Cloud APIs
- Artifact Registry Docker repository
- Cloud Build image build from the project Dockerfile
- Cloud Run v2 service
- Runtime service account
- Optional Secret Manager secrets for Gemini and API auth
- Optional public Cloud Run invoker IAM binding

## Minimal Deploy

\`\`\`bash
cd infra/terraform
terraform init
terraform apply \\
  -var project_id="$GOOGLE_CLOUD_PROJECT" \\
  -var source_revision="$(date +%Y%m%d%H%M%S)"
\`\`\`

The deployed URL is printed as \`service_url\`.

## Verify

\`\`\`bash
curl "$(terraform output -raw health_url)"
curl "$(terraform output -raw ready_url)"
\`\`\`

For complete instructions, read \`../../docs/terraform.md\` or \`../../docs/terraform.html\`.
`;
}

function terraformMd(project) {
  return `# ${project.name} Terraform Deploy Guide

${project.tagline}

## Verified Hackathon Target

The local hackathon source material requires a Google Cloud application runtime, Google Cloud AI technology, a public GitHub repository URL, a deployed project URL, and a ProtoPedia system architecture entry. This project maps those requirements as follows.

| Requirement | Implementation |
| --- | --- |
| Google Cloud application runtime | Cloud Run v2 service managed by \`infra/terraform\` |
| Google Cloud AI technology | Gemini API through \`@google/genai\`, with \`GEMINI_MODEL\` configured by Terraform |
| Deployable URL | Terraform output \`service_url\` |
| System architecture diagram | \`docs/architecture.svg\` |
| GitHub-ready source | README, Dockerfile, CI, security docs, and Terraform are in this project folder |

## Architecture

![${project.name} architecture](./architecture.svg)

## What Terraform Provisions

${list([
    "Google Cloud APIs: Cloud Run, Cloud Build, Artifact Registry, IAM, Secret Manager",
    "Artifact Registry Docker repository for the application image",
    "Cloud Build invocation that builds this repository's Dockerfile",
    "Cloud Run service with /api/health and /api/ready startup probe support",
    "Runtime service account with optional Secret Manager access",
    "Optional public invoker binding for hackathon judging",
  ])}

## Prerequisites

${list([
    "Terraform 1.6 or newer",
    "Google Cloud SDK with `gcloud auth login` and `gcloud auth application-default login` completed",
    "A Google Cloud project with billing enabled",
    "Permission to enable APIs, run Cloud Build, create Artifact Registry repositories, create service accounts, and deploy Cloud Run",
  ])}

## First Deploy

\`\`\`bash
cd outputs/${project.slug}/infra/terraform
terraform init
terraform apply \\
  -var project_id="$GOOGLE_CLOUD_PROJECT" \\
  -var source_revision="$(date +%Y%m%d%H%M%S)"
\`\`\`

Terraform builds the container with Cloud Build, pushes it to Artifact Registry, and deploys the Cloud Run service. The hackathon submission URL is:

\`\`\`bash
terraform output -raw service_url
\`\`\`

## Gemini API Key

The app has a deterministic fallback for demos, but a Gemini-backed judging demo should attach a key. The recommended production path is to create the secret outside Terraform and pass the secret ID:

\`\`\`bash
printf "%s" "$GEMINI_API_KEY" | gcloud secrets create ${project.packageName}-gemini-api-key \\
  --project "$GOOGLE_CLOUD_PROJECT" \\
  --replication-policy automatic \\
  --data-file -

terraform apply \\
  -var project_id="$GOOGLE_CLOUD_PROJECT" \\
  -var existing_gemini_api_secret_id="${project.packageName}-gemini-api-key" \\
  -var require_gemini=true \\
  -var source_revision="$(date +%Y%m%d%H%M%S)"
\`\`\`

For a disposable demo environment, \`-var gemini_api_key="$GEMINI_API_KEY"\` also works, but Terraform state will contain the secret value.

## Smoke Verification

\`\`\`bash
SERVICE_URL="$(terraform output -raw service_url)"
curl -fsS "$SERVICE_URL/api/health"
curl -fsS "$SERVICE_URL/api/ready"
curl -fsS "$SERVICE_URL/api/version"
\`\`\`

Open \`$SERVICE_URL\`, run the sample scenario, and confirm a ${project.positive} / ${project.caution} / ${project.negative} decision is rendered.

## Redeploy After Code Changes

\`\`\`bash
terraform apply \\
  -var project_id="$GOOGLE_CLOUD_PROJECT" \\
  -var source_revision="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
\`\`\`

\`source_revision\` is part of the Terraform build trigger. Change it whenever you want Cloud Build to rebuild the same image tag.

## Lock Down After Judging

${list([
    "Set `allow_unauthenticated_api=false` and provide `api_auth_token` for protected POST APIs.",
    "Set `cors_origin` to the final Cloud Run URL or your custom frontend origin.",
    "Set `allow_wildcard_cors=false` after `cors_origin` is specific.",
    "Set `require_gemini=true` once the Gemini secret is attached.",
    "Increase `deletion_protection=true` for long-lived deployments.",
  ])}

## Cleanup

\`\`\`bash
terraform destroy -var project_id="$GOOGLE_CLOUD_PROJECT"
\`\`\`
`;
}

function terraformHtml(project) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(project.name)} Terraform Deploy Guide</title>
  <style>
    :root { color-scheme: light; --accent: ${escapeHtml(project.accent)}; --secondary: ${escapeHtml(project.secondary)}; --ink: #17202a; --muted: #53606d; --line: #d7dee7; --soft: #f5f7fa; --paper: #ffffff; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--soft); color: var(--ink); line-height: 1.7; }
    header { color: white; background: linear-gradient(135deg, var(--accent), var(--secondary)); padding: 34px 0 40px; }
    header .inner, main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
    main { padding: 30px 0 56px; }
    h1 { margin: 0 0 10px; font-size: clamp(2rem, 5vw, 4rem); line-height: 1; letter-spacing: 0; }
    h2 { margin: 0 0 14px; font-size: 1.35rem; letter-spacing: 0; }
    p { margin: 0 0 14px; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
    nav a { color: white; border: 1px solid rgba(255,255,255,.55); text-decoration: none; padding: 8px 10px; border-radius: 6px; font-weight: 700; }
    section { margin-top: 20px; padding: 22px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .box { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: #fff; }
    pre { overflow-x: auto; padding: 14px; color: #e5e7eb; background: #111827; border-radius: 8px; }
    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid var(--line); padding: 10px; text-align: left; vertical-align: top; }
    th { background: #eef2f7; }
    img.diagram { display: block; width: 100%; max-width: 1200px; border: 1px solid var(--line); border-radius: 8px; background: #fbfcfe; }
    .muted { color: var(--muted); }
    @media (max-width: 780px) { .grid { grid-template-columns: 1fr; } section { padding: 18px; } }
  </style>
</head>
<body>
  <header>
    <div class="inner">
      <h1>${escapeHtml(project.name)}</h1>
      <p>${escapeHtml(project.tagline)}</p>
      <nav aria-label="docs">
        <a href="../README.md">README</a>
        <a href="./manual.html">操作マニュアル</a>
        <a href="./development.html">開発ガイド</a>
        <a href="./terraform.md">Markdown版</a>
      </nav>
    </div>
  </header>
  <main>
    <section>
      <h2>Terraformで作るもの</h2>
      <div class="grid">
        <div class="box"><strong>Cloud Run</strong><br />Vite UI と Express API を1つのサービスで公開します。</div>
        <div class="box"><strong>Cloud Build</strong><br />このプロジェクトの Dockerfile をビルドして Artifact Registry へpushします。</div>
        <div class="box"><strong>Gemini ready</strong><br />Secret Manager 経由で Gemini API key を接続できます。</div>
      </div>
    </section>
    <section>
      <h2>構成図</h2>
      <img class="diagram" src="./architecture.svg" alt="${escapeHtml(project.name)} Terraform architecture" />
    </section>
    <section>
      <h2>最短デプロイ</h2>
      <pre><code>cd outputs/${escapeHtml(project.slug)}/infra/terraform
terraform init
terraform apply \\
  -var project_id="$GOOGLE_CLOUD_PROJECT" \\
  -var source_revision="$(date +%Y%m%d%H%M%S)"</code></pre>
      <p class="muted">Cloud Build、Artifact Registry、Cloud RunをTerraformからまとめて作成します。</p>
    </section>
    <section>
      <h2>検証</h2>
      <pre><code>SERVICE_URL="$(terraform output -raw service_url)"
curl -fsS "$SERVICE_URL/api/health"
curl -fsS "$SERVICE_URL/api/ready"
curl -fsS "$SERVICE_URL/api/version"</code></pre>
      <p>画面を開き、${escapeHtml(project.positive)} / ${escapeHtml(project.caution)} / ${escapeHtml(project.negative)} の判断が表示されることを確認します。</p>
    </section>
    <section>
      <h2>提出に使う項目</h2>
      <table>
        <tr><th>提出項目</th><th>値</th></tr>
        <tr><td>デプロイした作品のURL</td><td><code>terraform output -raw service_url</code></td></tr>
        <tr><td>システム構成</td><td><code>docs/architecture.svg</code> とこのHTML</td></tr>
        <tr><td>開発素材</td><td>Cloud Run, Gemini API, Cloud Build, Artifact Registry, Secret Manager, Terraform</td></tr>
      </table>
    </section>
  </main>
</body>
</html>
`;
}

function updateProjectReadme(project, readmePath) {
  let readme = readFileSync(readmePath, "utf8");
  if (readme.includes("## Terraform / Cloud Run IaC")) return;

  const section = `\n## Terraform / Cloud Run IaC\n\nこのプロジェクトは、ハッカソン提出要件の「Google Cloudアプリケーション実行プロダクト」と「デプロイ済みURL」を満たすため、Cloud Run向けTerraformを同梱しています。\n\n- [Terraform deploy guide](./docs/terraform.md)\n- [Terraform HTML guide](./docs/terraform.html)\n- [Architecture SVG](./docs/architecture.svg)\n- [Terraform module](./infra/terraform/)\n\n最短実行:\n\n\`\`\`bash\ncd infra/terraform\nterraform init\nterraform apply \\\n  -var project_id=\"$GOOGLE_CLOUD_PROJECT\" \\\n  -var source_revision=\"$(date +%Y%m%d%H%M%S)\"\n\`\`\`\n\nデプロイ後は \`terraform output -raw service_url\` を作品提出フォームのデプロイURLとして使います。\n`;

  const marker = "\n## デモシナリオ\n";
  readme = readme.includes(marker) ? readme.replace(marker, `${section}${marker}`) : `${readme}${section}`;
  writeText(readmePath, readme);
}

for (const dir of projectDirs) {
  const projectRoot = join(outputsDir, dir);
  const project = parseProject(join(projectRoot, "src/project.ts"));
  const terraformDir = join(projectRoot, "infra", "terraform");
  const docsDir = join(projectRoot, "docs");
  mkdirSync(terraformDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });

  writeText(join(terraformDir, "versions.tf"), versionsTf());
  writeText(join(terraformDir, "variables.tf"), variablesTf(project));
  writeText(join(terraformDir, "main.tf"), mainTf(project));
  writeText(join(terraformDir, "outputs.tf"), outputsTf());
  writeText(join(terraformDir, "terraform.tfvars.example"), tfvarsExample(project));
  writeText(join(terraformDir, "README.md"), terraformReadme(project));
  writeText(join(docsDir, "architecture.svg"), architectureSvg(project));
  writeText(join(docsDir, "terraform.md"), terraformMd(project));
  writeText(join(docsDir, "terraform.html"), terraformHtml(project));
  updateProjectReadme(project, join(projectRoot, "README.md"));
}

const manifestPath = join(outputsDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
for (const project of manifest.projects) {
  project.docs = {
    ...(project.docs || {}),
    terraform: `${project.path}/docs/terraform.md`,
    terraformHtml: `${project.path}/docs/terraform.html`,
    architectureSvg: `${project.path}/docs/architecture.svg`,
  };
  project.terraform = {
    module: `${project.path}/infra/terraform`,
    cloudRun: true,
    cloudBuild: true,
    artifactRegistry: true,
    secretManager: true,
  };
}
manifest.terraformReadiness = {
  generatedAt: "2026-05-26",
  projectCount: manifest.projects.length,
  cloudRunTarget: true,
  cloudBuildImageBuild: true,
  artifactRegistry: true,
  secretManagerOptional: true,
  markdownGuide: true,
  htmlGuide: true,
  architectureSvg: true,
};
writeText(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const rootReadmePath = join(outputsDir, "README.md");
if (existsSync(rootReadmePath)) {
  let rootReadme = readFileSync(rootReadmePath, "utf8");
  if (!rootReadme.includes("## Terraform / Cloud Run Deployment")) {
    rootReadme += `\n## Terraform / Cloud Run Deployment\n\nAll 20 projects include project-local Terraform under \`infra/terraform/\`. The modules deploy each app to Cloud Run, build the Docker image with Cloud Build, store images in Artifact Registry, and optionally attach Gemini/API secrets from Secret Manager. Each project also includes \`docs/terraform.md\`, \`docs/terraform.html\`, and \`docs/architecture.svg\` for human-readable deployment and ProtoPedia system architecture documentation.\n`;
    writeText(rootReadmePath, rootReadme);
  }
}

console.log(`Added Terraform Cloud Run docs to ${projectDirs.length} projects.`);
