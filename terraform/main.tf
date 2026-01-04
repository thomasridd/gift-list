terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure this for your environment
    # bucket = "your-terraform-state-bucket"
    # key    = "gift-list/terraform.tfstate"
    # region = "us-east-1"
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
