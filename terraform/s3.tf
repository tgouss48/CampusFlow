# S3 - Frontend Statique

resource "aws_s3_bucket" "frontend" {
  bucket        = var.domain_name
  force_destroy = true
}

# Autorise l'accès public pour l'hébergement statique
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Politique S3 : Lecture publique
resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.public_read.json
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

data "aws_iam_policy_document" "public_read" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

# Deuxième bucket S3 pour la redirection www -> domaine racine
resource "aws_s3_bucket" "frontend_www" {
  bucket        = "www.${var.domain_name}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "frontend_www" {
  bucket = aws_s3_bucket.frontend_www.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend_www" {
  bucket = aws_s3_bucket.frontend_www.id

  redirect_all_requests_to {
    host_name = var.domain_name
    protocol  = "https"
  }
}

