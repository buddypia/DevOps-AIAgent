#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REPO="${REPO:-buddypia/DevOps-AIAgent}"
POOL_ID="${POOL_ID:-github-actions}"
PROVIDER_ID="${PROVIDER_ID:-github}"
SERVICE_ACCOUNT_ID="${SERVICE_ACCOUNT_ID:-github-actions-deployer}"

is_dry_run() {
  [[ "${DRY_RUN}" == "1" || "${DRY_RUN}" == "true" ]]
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$1 is required." >&2
    exit 1
  fi
}

run() {
  if is_dry_run; then
    printf '+'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

if [[ -z "${PROJECT_ID}" ]]; then
  echo "PROJECT_ID is required. Set it or run: gcloud config set project YOUR_PROJECT_ID" >&2
  exit 1
fi

if ! is_dry_run; then
  require_command gcloud
  require_command gh
  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI is not authenticated. Run: gh auth login" >&2
    exit 1
  fi
fi

if is_dry_run; then
  PROJECT_NUMBER="${PROJECT_NUMBER:-123456789012}"
  echo "DRY_RUN=1: no Google Cloud or GitHub resources will be changed."
else
  run gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    iam.googleapis.com \
    iamcredentials.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    sts.googleapis.com \
    --project="${PROJECT_ID}"
  PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")"
fi

SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}"
PROVIDER_RESOURCE="${POOL_RESOURCE}/providers/${PROVIDER_ID}"

if is_dry_run || ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  run gcloud iam service-accounts create "${SERVICE_ACCOUNT_ID}" \
    --project="${PROJECT_ID}" \
    --display-name="GitHub Actions Cloud Run deployer"
fi

run gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudbuild.builds.editor" \
  --quiet

CLOUD_BUILD_SERVICE_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
for role in roles/run.admin roles/artifactregistry.writer roles/secretmanager.secretAccessor roles/iam.serviceAccountUser; do
  run gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${CLOUD_BUILD_SERVICE_ACCOUNT}" \
    --role="${role}" \
    --quiet
done

if is_dry_run || ! gcloud iam workload-identity-pools describe "${POOL_ID}" --project="${PROJECT_ID}" --location="global" >/dev/null 2>&1; then
  run gcloud iam workload-identity-pools create "${POOL_ID}" \
    --project="${PROJECT_ID}" \
    --location="global" \
    --display-name="GitHub Actions"
fi

if is_dry_run || ! gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_ID}" >/dev/null 2>&1; then
  run gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
    --project="${PROJECT_ID}" \
    --location="global" \
    --workload-identity-pool="${POOL_ID}" \
    --display-name="GitHub Actions OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com/" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='${REPO}' && assertion.ref=='refs/heads/main'"
fi

run gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_RESOURCE}/attribute.repository/${REPO}" \
  --quiet

run gh secret set GCP_PROJECT_ID --body "${PROJECT_ID}"
run gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body "${PROVIDER_RESOURCE}"
run gh secret set GCP_DEPLOY_SERVICE_ACCOUNT --body "${SERVICE_ACCOUNT_EMAIL}"

if is_dry_run; then
  BOOTSTRAP_STATUS="GitHub Actions Cloud Run deploy bootstrap dry run complete."
else
  BOOTSTRAP_STATUS="GitHub Actions Cloud Run deploy bootstrap complete."
fi

cat <<EOF
${BOOTSTRAP_STATUS}

GCP_PROJECT_ID=${PROJECT_ID}
GCP_WORKLOAD_IDENTITY_PROVIDER=${PROVIDER_RESOURCE}
GCP_DEPLOY_SERVICE_ACCOUNT=${SERVICE_ACCOUNT_EMAIL}

Next:
gh workflow run deploy-cloud-run.yml --ref main \\
  -f region=asia-northeast1 \\
  -f service=a2a-agent-marketplace \\
  -f repository=cloud-run-source-deploy \\
  -f gemini_secret=gemini-api-key-a2a-marketplace \\
  -f target_url=https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app
EOF
