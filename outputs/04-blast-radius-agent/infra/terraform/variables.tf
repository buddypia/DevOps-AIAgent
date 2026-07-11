variable "project_id" {
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
  default     = "blast-radius-agent"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$", var.service_name))
    error_message = "service_name must be a valid Cloud Run service name."
  }
}

variable "repository_id" {
  description = "Artifact Registry Docker repository ID."
  type        = string
  default     = "blast-radius-agent-repo"
}

variable "runtime_service_account_id" {
  description = "Service account ID used by the Cloud Run revision."
  type        = string
  default     = "sa-04-blast-radius-agent"
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
  default     = "blast-radius-agent-gemini-api-key"
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
  default     = "blast-radius-agent-api-auth-token"
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
