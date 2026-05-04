# AWS MSK - Managed Streaming for Apache Kafka (Serverless)


resource "aws_msk_serverless_cluster" "kafka" {
  cluster_name = "${var.project_name}-msk"

  vpc_config {
    subnet_ids         = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_group_ids = [aws_security_group.msk_sg.id]
  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }
    }
  }
}

# IAM Policy pour autoriser ECS à se connecter à MSK
resource "aws_iam_policy" "ecs_msk_policy" {
  name        = "${var.project_name}-ecs-msk-policy"
  description = "Autorise les tâches ECS à utiliser MSK avec authentification IAM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:Connect",
          "kafka-cluster:AlterCluster",
          "kafka-cluster:DescribeCluster"
        ]
        Resource = [aws_msk_serverless_cluster.kafka.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:*Topic*",
          "kafka-cluster:ReadData",
          "kafka-cluster:WriteData"
        ]
        Resource = [
          "arn:aws:kafka:${var.aws_region}:*:topic/${var.project_name}-msk/*",
          "arn:aws:kafka:${var.aws_region}:*:topic/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:AlterGroup",
          "kafka-cluster:DescribeGroup"
        ]
        Resource = [
          "arn:aws:kafka:${var.aws_region}:*:group/${var.project_name}-msk/*",
          "arn:aws:kafka:${var.aws_region}:*:group/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_msk_attach" {
  role       = aws_iam_role.ecs_task_role.name # Doit être appliqué au Task Role des services
  policy_arn = aws_iam_policy.ecs_msk_policy.arn
}
