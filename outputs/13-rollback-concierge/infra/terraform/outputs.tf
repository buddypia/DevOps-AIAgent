output "service_name" {
  description = "Cloud Run service name."
  value       = google_cloud_run_v2_service.app.name
}

output "service_url" {
  description = "Deployed Cloud Run URL to submit to the hackathon form."
  value       = google_cloud_run_v2_service.app.uri
}

output "health_url" {
  description = "Health endpoint for smoke verification."
  value       = "${google_cloud_run_v2_service.app.uri}/api/health"
}

output "ready_url" {
  description = "Readiness endpoint for smoke verification."
  value       = "${google_cloud_run_v2_service.app.uri}/api/ready"
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
