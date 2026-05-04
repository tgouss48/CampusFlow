# CLOUDWATCH ALARMS - Monitoring & Alerting

# --- SNS Topic pour les alertes ---
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-topic"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}


# --- ALB Errors (5xx) ---
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Too many 5xx errors from the ALB target group"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# --- ECS CPU Utilization ---
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS Cluster CPU utilization is too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# --- RDS Storage (Boucle sur toutes les bases) ---
locals {
  rds_instances = {
    auth       = aws_db_instance.auth.id
    annonces   = aws_db_instance.annonces.id
    evenements = aws_db_instance.evenements.id
    sociale    = aws_db_instance.sociale.id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  for_each            = local.rds_instances
  alarm_name          = "${var.project_name}-rds-${each.key}-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2000000000 # 2 GB en octets
  alarm_description   = "Free storage space is too low on ${each.key} DB"

  dimensions = {
    DBInstanceIdentifier = each.value
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
