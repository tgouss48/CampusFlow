# SECRETS MANAGER - Gestion Sécurisée des Identifiants

# Clé secrète principale
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}-app-secrets-v1"
}

resource "aws_secretsmanager_secret_version" "app_secrets_val" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    db_password_auth       = random_password.auth_db_password.result
    db_password_annonces   = random_password.annonces_db_password.result
    db_password_evenements = random_password.evenements_db_password.result
    db_password_sociale    = random_password.sociale_db_password.result
    jwt_secret             = var.jwt_secret
    auth_smtp_user         = var.auth_smtp_user
    auth_smtp_pass         = var.auth_smtp_pass
  })
}

# Politique IAM pour autoriser ECS à lire les secrets
resource "aws_iam_policy" "ecs_secrets_policy" {
  name        = "${var.project_name}-ecs-secrets-policy"
  description = "Autorise ECS à lire les secrets applicatifs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [aws_secretsmanager_secret.app_secrets.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_secrets_attach" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets_policy.arn
}
