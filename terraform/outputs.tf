# OUTPUTS - CampusFlow

output "app_url" {
  description = "URL publique de l'application (HTTPS)"
  value       = "https://${var.domain_name}"
}

output "alb_dns" {
  description = "DNS brut de l'ALB"
  value       = aws_lb.main.dns_name
}



output "rds_auth_endpoint" {
  description = "Endpoint RDS - Auth Service"
  value       = aws_db_instance.auth.endpoint
  sensitive   = true
}

output "rds_annonces_endpoint" {
  description = "Endpoint RDS - Annonces Service"
  value       = aws_db_instance.annonces.endpoint
  sensitive   = true
}

output "rds_evenements_endpoint" {
  description = "Endpoint RDS - Evenements Service"
  value       = aws_db_instance.evenements.endpoint
  sensitive   = true
}

output "rds_sociale_endpoint" {
  description = "Endpoint RDS - Sociale Service"
  value       = aws_db_instance.sociale.endpoint
  sensitive   = true
}

output "ecr_auth_url" {
  value = aws_ecr_repository.auth.repository_url
}

output "ecr_annonces_url" {
  value = aws_ecr_repository.annonces.repository_url
}

output "ecr_evenements_url" {
  value = aws_ecr_repository.evenements.repository_url
}

output "ecr_sociale_url" {
  value = aws_ecr_repository.sociale.repository_url
}

output "ecr_gateway_url" {
  value = aws_ecr_repository.gateway.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "cloudflare_zone_id" {
  description = "Zone ID Cloudflare"
  value       = local.cloudflare_zone_id
}
