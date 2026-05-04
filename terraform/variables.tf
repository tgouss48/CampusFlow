# VARIABLES TERRAFORM - CampusFlow
# Toutes les variables nécessaires pour le déploiement AWS.
# Valeurs à définir dans terraform.tfvars (gitignored).

# INFRASTRUCTURE
variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "eu-west-3"
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "campusflow"
}

variable "app_version" {
  description = "Version de l'application (tag Docker) à déployer"
  type        = string
  default     = "latest"
}

variable "alert_email" {
  description = "Adresse email pour recevoir les alertes CloudWatch"
  type        = string
  default     = "otaga48@gmail.com"
}

variable "domain_name" {
  description = "Nom de domaine principal"
  type        = string
  default     = "campus-ensias.online"
}

variable "cloudflare_api_token" {
  description = "Token API Cloudflare (Dashboard → My Profile → API Tokens)"
  type        = string
  sensitive   = true
}

# BASE DE DONNÉES
variable "db_username" {
  description = "Nom d'utilisateur RDS"
  type        = string
  default     = "postgres"
}


# JWT
variable "jwt_secret" {
  description = "Clé secrète JWT partagée par tous les services"
  type        = string
  sensitive   = true
}

# AUTH SERVICE
variable "auth_jwt_access_exp" {
  type    = string
  default = "PT15M"
}

variable "auth_jwt_refresh_exp" {
  type    = string
  default = "P14D"
}

variable "auth_refresh_cookie_name" {
  type    = string
  default = "refresh_token"
}

variable "auth_refresh_cookie_secure" {
  type    = string
  default = "true" # true en production
}

variable "auth_refresh_cookie_samesite" {
  type    = string
  default = "Lax"
}

variable "auth_refresh_cookie_path" {
  type    = string
  default = "/api/auth"
}

variable "auth_verification_exp" {
  type    = string
  default = "PT24H"
}

variable "auth_pw_reset_exp" {
  type    = string
  default = "PT1H"
}

variable "auth_mail_from" {
  type    = string
  default = "no-reply@campus-ensias.online"
}

variable "auth_smtp_host" {
  type    = string
  default = "smtp.gmail.com"
}

variable "auth_smtp_port" {
  type    = string
  default = "587"
}

variable "auth_smtp_user" {
  description = "Adresse email SMTP"
  type        = string
  sensitive   = true
}

variable "auth_smtp_pass" {
  description = "Mot de passe SMTP (App Password)"
  type        = string
  sensitive   = true
}

variable "auth_rate_limit_max" {
  type    = string
  default = "10"
}

variable "auth_rate_limit_window" {
  type    = string
  default = "PT60S"
}

variable "auth_rate_limit_cleanup_ms" {
  type    = string
  default = "300000"
}

variable "auth_scheduling_purge_refresh_cron" {
  type    = string
  default = "0 0 * * * *"
}

variable "auth_scheduling_purge_account_cron" {
  type    = string
  default = "0 */30 * * * *"
}

# EVENEMENTS SERVICE
variable "evenements_inscription_ongoing_enabled" {
  type    = string
  default = "false"
}

# SOCIALE SERVICE
variable "sociale_presence_timeout" {
  type    = string
  default = "PT45S"
}

variable "sociale_ws_user_id_attr" {
  type    = string
  default = "social.userId"
}

variable "sociale_ws_token_param" {
  type    = string
  default = "access_token"
}

# KAFKA
variable "kafka_topic_user_profile_updates" {
  type    = string
  default = "user-profile-updates"
}
