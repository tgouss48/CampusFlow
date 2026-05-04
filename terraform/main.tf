terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # ⚠️ PRÉ-REQUIS : Créer ces ressources AVANT terraform init :
  #   aws s3api create-bucket --bucket campusflow-tf-state --region eu-west-3 \
  #     --create-bucket-configuration LocationConstraint=eu-west-3
  #   aws dynamodb create-table --table-name campusflow-tf-lock \
  #     --attribute-definitions AttributeName=LockID,AttributeType=S \
  #     --key-schema AttributeName=LockID,KeyType=HASH \
  #     --billing-mode PAY_PER_REQUEST
  backend "s3" {
    bucket         = "campusflow-tf-state"
    key            = "production/terraform.tfstate"
    region         = "eu-west-3"
    dynamodb_table = "campusflow-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Environment = "production"
    }
  }
}

# Provider AWS us-east-1 (requis pour les certificats ACM CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Environment = "production"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
