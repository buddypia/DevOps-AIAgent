provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  source_dir                    = abspath("${path.module}/../..")
  container_image               = var.image != "" ? var.image : "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}/${var.service_name}:${var.image_tag}"
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
      rank       = "05"
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
  description   = "Docker images for Privacy Impact Diff Agent."
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
    command = "gcloud builds submit ${local.source_dir} --tag ${local.container_image} --project ${var.project_id} --quiet"
  }

  depends_on = [
    google_artifact_registry_repository.app,
    google_project_service.required,
  ]
}

resource "google_service_account" "runtime" {
  project      = var.project_id
  account_id   = var.runtime_service_account_id
  display_name = "Privacy Impact Diff Agent Cloud Run runtime"
  description  = "Runtime identity for the Privacy Impact Diff Agent hackathon Cloud Run service."

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
  member    = "serviceAccount:${google_service_account.runtime.email}"

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
  member    = "serviceAccount:${google_service_account.runtime.email}"

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
