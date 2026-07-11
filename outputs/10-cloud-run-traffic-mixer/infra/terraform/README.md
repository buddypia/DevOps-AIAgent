# Terraform: Cloud Run Traffic Mixer

This directory deploys Cloud Run Traffic Mixer to Google Cloud Run for the DevOps x AI Agent Hackathon.

## What Terraform Creates

- Required Google Cloud APIs
- Artifact Registry Docker repository
- Cloud Build image build from the project Dockerfile
- Cloud Run v2 service
- Runtime service account
- Optional Secret Manager secrets for Gemini and API auth
- Optional public Cloud Run invoker IAM binding

## Minimal Deploy

```bash
cd infra/terraform
terraform init
terraform apply \
  -var project_id="$GOOGLE_CLOUD_PROJECT" \
  -var source_revision="$(date +%Y%m%d%H%M%S)"
```

The deployed URL is printed as `service_url`.

## Verify

```bash
curl "$(terraform output -raw health_url)"
curl "$(terraform output -raw ready_url)"
```

For complete instructions, read `../../docs/terraform.md` or `../../docs/terraform.html`.
