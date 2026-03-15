variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "gift-list"
}

variable "cors_origin" {
  description = "CORS origin for API Gateway"
  type        = string
  default     = "*"
}

variable "google_client_id" {
  description = "Google OAuth2 Client ID"
  type        = string
}
