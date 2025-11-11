---
id: aws-rds-postgres
category: guide
tags: [aws, rds, postgres, database, terraform]
capabilities:
  - RDS PostgreSQL setup
  - Multi-AZ configuration
  - Backup and monitoring
useWhen:
  - Deploying production PostgreSQL 15+ on AWS RDS with Terraform requiring Multi-AZ for 99.95% SLA and automatic failover
  - Setting up managed PostgreSQL with encrypted storage using KMS, 30-day backup retention, and Performance Insights monitoring
  - Building RDS PostgreSQL instances with auto-scaling storage from 100GB to 1TB using gp3 for cost-effective IOPS
  - Provisioning databases requiring read replicas in same or different regions for read-heavy workloads and disaster recovery
  - Deploying RDS with security best practices including private subnets, security group restrictions, and no public accessibility
  - Setting up PostgreSQL databases requiring scheduled maintenance windows, CloudWatch log exports, and deletion protection
estimatedTokens: 420
---

# AWS RDS PostgreSQL Setup

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.large"

  # Storage
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  # High Availability
  multi_az               = true
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project}-final-snapshot"

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
}

# Read Replica (optional)
resource "aws_db_instance" "replica" {
  identifier          = "${var.project}-db-replica"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.t3.medium"
  publicly_accessible = false
}

# Security Group
resource "aws_security_group" "rds" {
  name   = "${var.project}-rds-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}
```

**Connection String:** 
`postgresql://${username}:${password}@${endpoint}:5432/${db_name}`
