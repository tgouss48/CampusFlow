# ECS - CampusFlow

# CLUSTER 
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

# SERVICE DISCOVERY 
resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "${var.project_name}.local"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "auth" {
  name = "auth-service"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
  health_check_custom_config { failure_threshold = 1 }
}

resource "aws_service_discovery_service" "annonces" {
  name = "annonces-service"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
  health_check_custom_config { failure_threshold = 1 }
}

resource "aws_service_discovery_service" "evenements" {
  name = "evenements-service"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
  health_check_custom_config { failure_threshold = 1 }
}

resource "aws_service_discovery_service" "sociale" {
  name = "sociale-service"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
  health_check_custom_config { failure_threshold = 1 }
}

resource "aws_service_discovery_service" "kafka" {
  name = "kafka"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
  health_check_custom_config { failure_threshold = 1 }
}

# IAM ROLES 
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

# LOGS 
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 14
}

# DATA SOURCE : MSK Bootstrap Brokers 
data "aws_msk_bootstrap_brokers" "kafka" {
  cluster_arn = aws_msk_serverless_cluster.kafka.arn
}

# LOCALS 
locals {
  kafka_host      = data.aws_msk_bootstrap_brokers.kafka.bootstrap_brokers_sasl_iam
  private_subnets = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  common_sg       = [aws_security_group.ecs_sg.id]

  log_config = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"  = aws_cloudwatch_log_group.ecs.name
      "awslogs-region" = var.aws_region
    }
  }
}

# GATEWAY SERVICE (Port 8080)
resource "aws_ecs_task_definition" "gateway" {
  family                   = "gateway"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name         = "gateway"
    image        = "${aws_ecr_repository.gateway.repository_url}:${var.app_version}"
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || wget --spider -q http://localhost:8080/actuator/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    environment = [
      { name = "GATEWAY_PORT", value = "8080" },
      { name = "EUREKA_CLIENT_ENABLED", value = "false" },
      { name = "SPRING_CLOUD_DISCOVERY_ENABLED", value = "false" },

      { name = "SPRING_CLOUD_GATEWAY_ROUTES_0_ID", value = "evenements-websocket" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_0_URI", value = "lb:ws://evenements-service" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_0_PREDICATES_0", value = "Path=/api/evenements/notifications/stream" },

      { name = "SPRING_CLOUD_GATEWAY_ROUTES_1_ID", value = "sociale-websocket" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_1_URI", value = "lb:ws://sociale-service" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_1_PREDICATES_0", value = "Path=/api/sociale/ws" },

      { name = "SPRING_CLOUD_GATEWAY_ROUTES_2_ID", value = "auth-service" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_2_URI", value = "http://auth-service.${var.project_name}.local:8081" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_2_PREDICATES_0", value = "Path=/api/auth/**" },

      { name = "SPRING_CLOUD_GATEWAY_ROUTES_3_ID", value = "annonces-service" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_3_URI", value = "http://annonces-service.${var.project_name}.local:8082" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_3_PREDICATES_0", value = "Path=/api/annonces/**,/api/commentaires/**" },

      { name = "SPRING_CLOUD_GATEWAY_ROUTES_4_ID", value = "evenements-service" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_4_URI", value = "http://evenements-service.${var.project_name}.local:8083" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_4_PREDICATES_0", value = "Path=/api/evenements/**" },

      { name = "SPRING_CLOUD_GATEWAY_ROUTES_5_ID", value = "sociale-service" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_5_URI", value = "http://sociale-service.${var.project_name}.local:8084" },
      { name = "SPRING_CLOUD_GATEWAY_ROUTES_5_PREDICATES_0", value = "Path=/api/sociale/**" },

      { name = "GATEWAY_ALLOWED_ORIGINS", value = "https://${var.domain_name}" }
    ]
    logConfiguration = merge(local.log_config, {
      options = merge(local.log_config.options, { "awslogs-stream-prefix" = "gateway" })
    })
  }])
}

resource "aws_ecs_service" "gateway" {
  name                 = "gateway"
  cluster              = aws_ecs_cluster.main.id
  task_definition      = aws_ecs_task_definition.gateway.arn
  desired_count        = 1
  launch_type          = "FARGATE"
  force_new_deployment = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.private_subnets
    security_groups  = local.common_sg
    assign_public_ip = false # Privé !
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.gateway.arn
    container_name   = "gateway"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]
}

# AUTH SERVICE (Port 8081)
resource "aws_ecs_task_definition" "auth" {
  family                   = "auth"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name         = "auth"
    image        = "${aws_ecr_repository.auth.repository_url}:${var.app_version}"
    portMappings = [{ containerPort = 8081, protocol = "tcp" }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8081/actuator/health || wget --spider -q http://localhost:8081/actuator/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    environment = [
      { name = "AUTH_PORT", value = "8081" },
      { name = "AUTH_DB_URL", value = "jdbc:postgresql://${aws_db_instance.auth.address}:5432/auth_db" },
      { name = "AUTH_DB_USERNAME", value = var.db_username },
      { name = "EUREKA_CLIENT_ENABLED", value = "false" },
      { name = "KAFKA_BOOTSTRAP_SERVERS", value = local.kafka_host },
      { name = "TOPIC_USER_PROFILE_UPDATES", value = var.kafka_topic_user_profile_updates },
      { name = "AUTH_JWT_ACCESS_EXP", value = var.auth_jwt_access_exp },
      { name = "AUTH_JWT_REFRESH_EXP", value = var.auth_jwt_refresh_exp },
      { name = "AUTH_REFRESH_COOKIE_NAME", value = var.auth_refresh_cookie_name },
      { name = "AUTH_REFRESH_COOKIE_SECURE", value = var.auth_refresh_cookie_secure },
      { name = "AUTH_REFRESH_COOKIE_SAMESITE", value = var.auth_refresh_cookie_samesite },
      { name = "AUTH_REFRESH_COOKIE_PATH", value = var.auth_refresh_cookie_path },
      { name = "AUTH_ALLOWED_ORIGINS", value = "https://${var.domain_name}" },
      { name = "AUTH_VERIFICATION_EXP", value = var.auth_verification_exp },
      { name = "AUTH_PW_RESET_EXP", value = var.auth_pw_reset_exp },
      { name = "AUTH_MAIL_FROM", value = var.auth_mail_from },
      { name = "AUTH_FRONTEND_URL", value = "https://${var.domain_name}" },
      { name = "AUTH_SMTP_HOST", value = var.auth_smtp_host },
      { name = "AUTH_SMTP_PORT", value = var.auth_smtp_port },
      { name = "AUTH_SMTP_SSL_TRUST", value = var.auth_smtp_host },
      { name = "AUTH_RATE_LIMIT_MAX", value = var.auth_rate_limit_max },
      { name = "AUTH_RATE_LIMIT_WINDOW", value = var.auth_rate_limit_window },
      { name = "AUTH_RATE_LIMIT_CLEANUP_MS", value = var.auth_rate_limit_cleanup_ms },
      { name = "APP_SECURITY_SCHEDULING_PURGE_EXPIRED_TOKENS_CRON", value = var.auth_scheduling_purge_refresh_cron },
      { name = "APP_SECURITY_SCHEDULING_PURGE_ACCOUNT_TOKENS_CRON", value = var.auth_scheduling_purge_account_cron }
    ]
    secrets = [
      { name = "AUTH_DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password_auth::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:jwt_secret::" },
      { name = "AUTH_SMTP_USER", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:auth_smtp_user::" },
      { name = "AUTH_SMTP_PASS", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:auth_smtp_pass::" }
    ]
    logConfiguration = merge(local.log_config, {
      options = merge(local.log_config.options, { "awslogs-stream-prefix" = "auth" })
    })
  }])
}

resource "aws_ecs_service" "auth" {
  name                 = "auth"
  cluster              = aws_ecs_cluster.main.id
  task_definition      = aws_ecs_task_definition.auth.arn
  desired_count        = 1
  launch_type          = "FARGATE"
  force_new_deployment = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.private_subnets
    security_groups  = local.common_sg
    assign_public_ip = false
  }

  service_registries { registry_arn = aws_service_discovery_service.auth.arn }
}

# ANNONCES SERVICE (Port 8082)
resource "aws_ecs_task_definition" "annonces" {
  family                   = "annonces"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name         = "annonces"
    image        = "${aws_ecr_repository.annonces.repository_url}:${var.app_version}"
    portMappings = [{ containerPort = 8082, protocol = "tcp" }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8082/actuator/health || wget --spider -q http://localhost:8082/actuator/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    environment = [
      { name = "ANNONCES_PORT", value = "8082" },
      { name = "ANNONCES_DB_URL", value = "jdbc:postgresql://${aws_db_instance.annonces.address}:5432/annonces_db" },
      { name = "ANNONCES_DB_USERNAME", value = var.db_username },
      { name = "EUREKA_CLIENT_ENABLED", value = "false" },
      { name = "KAFKA_BOOTSTRAP_SERVERS", value = local.kafka_host },
      { name = "TOPIC_USER_PROFILE_UPDATES", value = var.kafka_topic_user_profile_updates }
    ]
    secrets = [
      { name = "ANNONCES_DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password_annonces::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:jwt_secret::" }
    ]
    logConfiguration = merge(local.log_config, {
      options = merge(local.log_config.options, { "awslogs-stream-prefix" = "annonces" })
    })
  }])
}

resource "aws_ecs_service" "annonces" {
  name                 = "annonces"
  cluster              = aws_ecs_cluster.main.id
  task_definition      = aws_ecs_task_definition.annonces.arn
  desired_count        = 1
  launch_type          = "FARGATE"
  force_new_deployment = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.private_subnets
    security_groups  = local.common_sg
    assign_public_ip = false
  }

  service_registries { registry_arn = aws_service_discovery_service.annonces.arn }
}

# EVENEMENTS SERVICE (Port 8083)
resource "aws_ecs_task_definition" "evenements" {
  family                   = "evenements"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name         = "evenements"
    image        = "${aws_ecr_repository.evenements.repository_url}:${var.app_version}"
    portMappings = [{ containerPort = 8083, protocol = "tcp" }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8083/actuator/health || wget --spider -q http://localhost:8083/actuator/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    environment = [
      { name = "EVENEMENTS_PORT", value = "8083" },
      { name = "EVENEMENTS_DB_URL", value = "jdbc:postgresql://${aws_db_instance.evenements.address}:5432/evenements_db" },
      { name = "EVENEMENTS_DB_USERNAME", value = var.db_username },
      { name = "EUREKA_CLIENT_ENABLED", value = "false" },
      { name = "KAFKA_BOOTSTRAP_SERVERS", value = local.kafka_host },
      { name = "TOPIC_USER_PROFILE_UPDATES", value = var.kafka_topic_user_profile_updates },
      { name = "EVENEMENTS_INSCRIPTION_ONGOING_ENABLED", value = var.evenements_inscription_ongoing_enabled }
    ]
    secrets = [
      { name = "EVENEMENTS_DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password_evenements::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:jwt_secret::" }
    ]
    logConfiguration = merge(local.log_config, {
      options = merge(local.log_config.options, { "awslogs-stream-prefix" = "evenements" })
    })
  }])
}

resource "aws_ecs_service" "evenements" {
  name                 = "evenements"
  cluster              = aws_ecs_cluster.main.id
  task_definition      = aws_ecs_task_definition.evenements.arn
  desired_count        = 1
  launch_type          = "FARGATE"
  force_new_deployment = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.private_subnets
    security_groups  = local.common_sg
    assign_public_ip = false
  }

  service_registries { registry_arn = aws_service_discovery_service.evenements.arn }
}

# SOCIALE SERVICE (Port 8084)
resource "aws_ecs_task_definition" "sociale" {
  family                   = "sociale"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name         = "sociale"
    image        = "${aws_ecr_repository.sociale.repository_url}:${var.app_version}"
    portMappings = [{ containerPort = 8084, protocol = "tcp" }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8084/actuator/health || wget --spider -q http://localhost:8084/actuator/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    environment = [
      { name = "SOCIALE_PORT", value = "8084" },
      { name = "SOCIALE_DB_URL", value = "jdbc:postgresql://${aws_db_instance.sociale.address}:5432/sociale_db" },
      { name = "SOCIALE_DB_USERNAME", value = var.db_username },
      { name = "EUREKA_CLIENT_ENABLED", value = "false" },
      { name = "KAFKA_BOOTSTRAP_SERVERS", value = local.kafka_host },
      { name = "TOPIC_USER_PROFILE_UPDATES", value = var.kafka_topic_user_profile_updates },
      { name = "SOCIALE_PRESENCE_TIMEOUT", value = var.sociale_presence_timeout },
      { name = "SOCIALE_WS_USER_ID_ATTR", value = var.sociale_ws_user_id_attr },
      { name = "SOCIALE_WS_TOKEN_PARAM", value = var.sociale_ws_token_param }
    ]
    secrets = [
      { name = "SOCIALE_DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password_sociale::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:jwt_secret::" }
    ]
    logConfiguration = merge(local.log_config, {
      options = merge(local.log_config.options, { "awslogs-stream-prefix" = "sociale" })
    })
  }])
}

resource "aws_ecs_service" "sociale" {
  name                 = "sociale"
  cluster              = aws_ecs_cluster.main.id
  task_definition      = aws_ecs_task_definition.sociale.arn
  desired_count        = 1
  launch_type          = "FARGATE"
  force_new_deployment = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.private_subnets
    security_groups  = local.common_sg
    assign_public_ip = false
  }

  service_registries { registry_arn = aws_service_discovery_service.sociale.arn }
}

# AUTO SCALING (Gateway)
resource "aws_appautoscaling_target" "gateway" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.gateway.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "gateway_cpu" {
  name               = "gateway-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.gateway.resource_id
  scalable_dimension = aws_appautoscaling_target.gateway.scalable_dimension
  service_namespace  = aws_appautoscaling_target.gateway.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 70.0
  }
}

# AUTO SCALING (Auth) 
resource "aws_appautoscaling_target" "auth" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.auth.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "auth_cpu" {
  name               = "auth-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.auth.resource_id
  scalable_dimension = aws_appautoscaling_target.auth.scalable_dimension
  service_namespace  = aws_appautoscaling_target.auth.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 70.0
  }
}

# AUTO SCALING (Annonces) 
resource "aws_appautoscaling_target" "annonces" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.annonces.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "annonces_cpu" {
  name               = "annonces-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.annonces.resource_id
  scalable_dimension = aws_appautoscaling_target.annonces.scalable_dimension
  service_namespace  = aws_appautoscaling_target.annonces.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 70.0
  }
}

# AUTO SCALING (Evenements) 
resource "aws_appautoscaling_target" "evenements" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.evenements.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "evenements_cpu" {
  name               = "evenements-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.evenements.resource_id
  scalable_dimension = aws_appautoscaling_target.evenements.scalable_dimension
  service_namespace  = aws_appautoscaling_target.evenements.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 70.0
  }
}

# AUTO SCALING (Sociale) 
resource "aws_appautoscaling_target" "sociale" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.sociale.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "sociale_cpu" {
  name               = "sociale-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.sociale.resource_id
  scalable_dimension = aws_appautoscaling_target.sociale.scalable_dimension
  service_namespace  = aws_appautoscaling_target.sociale.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 70.0
  }
}
