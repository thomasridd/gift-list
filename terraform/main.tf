terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "gift-list-terraform-state-348343647471"
    region  = "us-east-1"
    encrypt = true
    # key is provided via -backend-config during init
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "gift-list"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
