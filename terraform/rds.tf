# RDS - PostgreSQL (Une instance par microservice)

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_db_parameter_group" "custom_postgres16" {
  name        = "${var.project_name}-postgres16"
  family      = "postgres16"
  description = "Custom parameter group for PostgreSQL 16"
}


resource "random_password" "auth_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "annonces_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "evenements_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "sociale_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_subnet_group" "rds" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

# --- Auth Service Database ---
resource "aws_db_instance" "auth" {
  identifier                = "${var.project_name}-auth-db"
  allocated_storage         = 20
  storage_type              = "gp3"
  engine                    = "postgres"
  engine_version            = "16"
  instance_class            = "db.t3.micro"
  db_name                   = "auth_db"
  username                  = var.db_username
  password                  = random_password.auth_db_password.result
  parameter_group_name      = aws_db_parameter_group.custom_postgres16.name
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-auth-db-final-snapshot"
  deletion_protection       = true

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  multi_az               = true
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
}

# --- Annonces Service Database ---
resource "aws_db_instance" "annonces" {
  identifier                = "${var.project_name}-annonces-db"
  allocated_storage         = 20
  storage_type              = "gp3"
  engine                    = "postgres"
  engine_version            = "16"
  instance_class            = "db.t3.micro"
  db_name                   = "annonces_db"
  username                  = var.db_username
  password                  = random_password.annonces_db_password.result
  parameter_group_name      = aws_db_parameter_group.custom_postgres16.name
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-annonces-db-final-snapshot"
  deletion_protection       = true

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  multi_az               = true
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Tue:04:00-Tue:05:00"
}

# --- Evenements Service Database ---
resource "aws_db_instance" "evenements" {
  identifier                = "${var.project_name}-evenements-db"
  allocated_storage         = 20
  storage_type              = "gp3"
  engine                    = "postgres"
  engine_version            = "16"
  instance_class            = "db.t3.micro"
  db_name                   = "evenements_db"
  username                  = var.db_username
  password                  = random_password.evenements_db_password.result
  parameter_group_name      = aws_db_parameter_group.custom_postgres16.name
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-evenements-db-final-snapshot"
  deletion_protection       = true

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  multi_az               = true
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Wed:04:00-Wed:05:00"
}

# --- Sociale Service Database ---
resource "aws_db_instance" "sociale" {
  identifier                = "${var.project_name}-sociale-db"
  allocated_storage         = 20
  storage_type              = "gp3"
  engine                    = "postgres"
  engine_version            = "16"
  instance_class            = "db.t3.micro"
  db_name                   = "sociale_db"
  username                  = var.db_username
  password                  = random_password.sociale_db_password.result
  parameter_group_name      = aws_db_parameter_group.custom_postgres16.name
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-sociale-db-final-snapshot"
  deletion_protection       = true

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  multi_az               = true
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Thu:04:00-Thu:05:00"
}
