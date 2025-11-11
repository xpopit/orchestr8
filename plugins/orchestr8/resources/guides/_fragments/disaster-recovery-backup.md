---
id: disaster-recovery-backup
category: guide
tags: [disaster-recovery, backup, velero, kubernetes, aws]
capabilities:
  - Kubernetes backup with Velero
  - Database backup strategies
  - Disaster recovery planning
useWhen:
  - Implementing Kubernetes backup strategy with Velero requiring daily automated backups with 30-day retention to S3
  - Building disaster recovery plans for production systems requiring RTO under 4 hours and RPO under 1 hour with tested restore procedures
  - Setting up RDS automated backups with 30-day retention, cross-region snapshot replication, and point-in-time recovery capability
  - Deploying backup solutions requiring namespace-level Velero backups, database snapshots, and S3 versioning with lifecycle policies
  - Implementing DR testing procedures with quarterly Velero restore validation and monthly database restore verification
  - Building multi-region backup architecture with S3 cross-region replication, backup verification, and documented recovery runbooks
estimatedTokens: 450
---

# Disaster Recovery & Backup Strategy

## Velero for Kubernetes Backup

```bash
# Install Velero CLI
brew install velero

# Install Velero on cluster (AWS example)
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.8.0 \
  --bucket my-backup-bucket \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1 \
  --secret-file ./credentials-velero

# Create backup schedule (daily at 2 AM)
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h

# Backup specific namespace
velero backup create production-backup \
  --include-namespaces production \
  --wait

# Restore from backup
velero restore create --from-backup production-backup

# Check backup status
velero backup describe production-backup
velero backup logs production-backup
```

## Database Backup Strategies

### PostgreSQL Automated Backups

```bash
# RDS automated backups (configured in Terraform)
# - 30-day retention
# - Daily snapshots
# - Point-in-time recovery

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier myapp-db \
  --db-snapshot-identifier myapp-manual-$(date +%Y%m%d)

# Copy snapshot to another region (DR)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:123456789:snapshot:myapp-snapshot \
  --target-db-snapshot-identifier myapp-dr-snapshot \
  --source-region us-east-1 \
  --region us-west-2

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier myapp-restored \
  --db-snapshot-identifier myapp-snapshot
```

### PostgreSQL pg_dump Backup

```bash
# Full database backup
pg_dump -h localhost -U postgres -d myapp \
  --format=custom \
  --file=backup-$(date +%Y%m%d).dump

# Schema-only backup
pg_dump -h localhost -U postgres -d myapp \
  --schema-only \
  --file=schema-$(date +%Y%m%d).sql

# Restore
pg_restore -h localhost -U postgres -d myapp_new backup.dump
```

## S3 Backup for Application Data

```bash
# Sync to S3 with versioning
aws s3 sync /data s3://my-backup-bucket/data/ \
  --delete \
  --storage-class STANDARD_IA

# Cross-region replication (Terraform)
resource "aws_s3_bucket_replication_configuration" "backup" {
  bucket = aws_s3_bucket.primary.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.dr.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

## Recovery Testing Checklist

- [ ] Test restore from Velero backup quarterly
- [ ] Test database restore monthly
- [ ] Verify RTO (Recovery Time Objective) < 4 hours
- [ ] Verify RPO (Recovery Point Objective) < 1 hour
- [ ] Document runbook for recovery procedures
- [ ] Train team on recovery process
- [ ] Test cross-region failover annually
