# CLOUDFLARE DNS + AWS ACM (Sous-domaines)

data "cloudflare_zones" "main" {
  filter {
    name = var.domain_name
  }
}

locals {
  cloudflare_zone_id = data.cloudflare_zones.main.zones[0].id
}

# 1. Racine : campus-ensias.online → Pointe vers S3 via Cloudflare
resource "cloudflare_record" "frontend" {
  zone_id         = local.cloudflare_zone_id
  name            = "@"
  content         = aws_s3_bucket_website_configuration.frontend.website_endpoint
  type            = "CNAME"
  proxied         = true # CDN Cloudflare activé
  allow_overwrite = true
}

resource "cloudflare_record" "frontend_www" {
  zone_id         = local.cloudflare_zone_id
  name            = "www"
  content         = aws_s3_bucket_website_configuration.frontend_www.website_endpoint
  type            = "CNAME"
  proxied         = true # CDN Cloudflare activé
  allow_overwrite = true
}

# 2. API : api.campus-ensias.online → Pointe vers l'ALB (Backend)
resource "cloudflare_record" "api" {
  zone_id = local.cloudflare_zone_id
  name    = "api"
  content = aws_lb.main.dns_name
  type    = "CNAME"
  proxied = true
}

# Certificat ACM - ALB
resource "aws_acm_certificate" "cert" {
  domain_name               = "*.${var.domain_name}"
  subject_alternative_names = [var.domain_name]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Validation DNS du certificat ALB via Cloudflare
resource "cloudflare_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.resource_record_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }...
  }

  zone_id = local.cloudflare_zone_id
  name    = each.value[0].name
  content = each.value[0].record
  type    = each.value[0].type
  ttl     = 120
  proxied = false
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in cloudflare_record.cert_validation : record.hostname]
}

# Configurer Cloudflare SSL (Provider v4)
resource "cloudflare_zone_settings_override" "main" {
  zone_id = local.cloudflare_zone_id

  settings {
    ssl                      = "flexible"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"
  }
}
