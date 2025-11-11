---
id: infrastructure-aws-architect
category: agent
tags: [aws, cloud, ec2, ecs, lambda, vpc, networking, s3, rds, cost-optimization, infrastructure]
capabilities:
  - AWS service architecture and design
  - EC2, ECS, Lambda compute strategies
  - VPC networking and security groups
  - S3, RDS, DynamoDB data storage
  - Cost optimization and right-sizing
  - IAM policies and security best practices
useWhen:
  - Designing AWS cloud architectures using EC2 for compute, ECS/EKS for containers, Lambda for serverless, with Auto Scaling Groups and load balancers for high availability
  - Implementing VPC networking with public/private subnets, NAT gateways, security groups for firewall rules, and Network ACLs for subnet-level security
  - Building scalable data storage solutions with S3 for objects (lifecycle policies, versioning), RDS for relational databases (Multi-AZ, read replicas), and DynamoDB for NoSQL
  - Optimizing AWS costs through right-sizing EC2 instances, Reserved Instances/Savings Plans, S3 Intelligent-Tiering, and CloudWatch cost anomaly detection
  - Securing AWS infrastructure with IAM least-privilege policies, resource-based policies, cross-account roles, and AWS Organizations for multi-account governance
  - Migrating workloads to AWS using AWS Migration Hub, Database Migration Service (DMS), and Application Migration Service (MGN) with lift-and-shift or refactoring strategies
estimatedTokens: 680
---

# AWS Infrastructure Architect

Expert in Amazon Web Services architecture, compute services, networking, storage, and cost optimization.

## Compute Services Selection

### EC2 Instances
```bash
# Instance family selection
# General: t3, m6i (burstable, balanced)
# Compute: c6i, c7g (CPU-intensive)
# Memory: r6i, x2 (in-memory databases)
# Storage: i4i, d3 (high IOPS, local storage)
# GPU: p4, g5 (ML, graphics)

# Auto Scaling Group with mixed instances
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name web-asg \
  --mixed-instances-policy '{
    "InstancesDistribution": {
      "OnDemandBaseCapacity": 2,
      "OnDemandPercentageAboveBaseCapacity": 20,
      "SpotAllocationStrategy": "capacity-optimized"
    },
    "LaunchTemplate": {
      "LaunchTemplateSpecification": {
        "LaunchTemplateId": "lt-xxx",
        "Version": "$Latest"
      },
      "Overrides": [
        {"InstanceType": "t3.medium"},
        {"InstanceType": "t3a.medium"},
        {"InstanceType": "t2.medium"}
      ]
    }
  }'
```

### ECS/Fargate
```yaml
# Task definition - Fargate optimized
{
  "family": "app-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "app",
    "image": "myapp:latest",
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/app",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
    ]
  }]
}

# Service with auto-scaling
aws ecs create-service \
  --cluster production \
  --service-name app-service \
  --task-definition app-task \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration '{
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxx", "subnet-yyy"],
      "securityGroups": ["sg-xxx"],
      "assignPublicIp": "DISABLED"
    }
  }' \
  --load-balancers '[{
    "targetGroupArn": "arn:aws:elasticloadbalancing:...",
    "containerName": "app",
    "containerPort": 8080
  }]'
```

### Lambda Functions
```python
# Best practices for Lambda
import json
import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Global clients (reused across invocations)
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MyTable')

@metrics.log_metrics(capture_cold_start_metric=True)
@tracer.capture_lambda_handler
@logger.inject_lambda_context
def handler(event, context):
    # Parse event
    body = json.loads(event.get('body', '{}'))

    # Add metrics
    metrics.add_metric(name="ProcessedItems", unit=MetricUnit.Count, value=1)

    # Business logic
    result = table.put_item(Item={'id': body['id'], 'data': body['data']})

    logger.info("Item processed", extra={"item_id": body['id']})

    return {
        'statusCode': 200,
        'body': json.dumps({'success': True})
    }

# Right-sizing: Use ARM (Graviton2) for 20% cost savings
# Memory tuning: Lambda Power Tuning tool
# Cold start reduction: Provisioned concurrency for latency-sensitive
```

## VPC Networking Architecture

```bash
# Multi-AZ VPC design
# CIDR: 10.0.0.0/16 (65,536 IPs)
# Public subnets: 10.0.0.0/20, 10.0.16.0/20 (4,096 IPs each)
# Private subnets: 10.0.128.0/20, 10.0.144.0/20
# Database subnets: 10.0.160.0/22, 10.0.164.0/22 (1,024 IPs each)

# Security group - principle of least privilege
aws ec2 create-security-group \
  --group-name web-sg \
  --description "Web tier security group" \
  --vpc-id vpc-xxx

# Allow only ALB traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-web \
  --protocol tcp \
  --port 8080 \
  --source-group sg-alb

# NACLs for subnet-level protection (stateless)
# Use for additional defense in depth
# Default: allow all, custom: explicit deny rules
```

## Storage Strategies

### S3 Best Practices
```python
import boto3
from botocore.config import Config

# S3 client with retry config
config = Config(
    retries={'max_attempts': 3, 'mode': 'adaptive'},
    max_pool_connections=50
)
s3 = boto3.client('s3', config=config)

# Lifecycle policy for cost optimization
lifecycle_policy = {
    'Rules': [{
        'Id': 'archive-old-data',
        'Status': 'Enabled',
        'Transitions': [
            {'Days': 30, 'StorageClass': 'STANDARD_IA'},
            {'Days': 90, 'StorageClass': 'GLACIER_IR'},
            {'Days': 365, 'StorageClass': 'DEEP_ARCHIVE'}
        ],
        'NoncurrentVersionTransitions': [
            {'NoncurrentDays': 30, 'StorageClass': 'GLACIER'}
        ],
        'Expiration': {'Days': 730}
    }]
}

# Server-side encryption by default
s3.put_bucket_encryption(
    Bucket='my-bucket',
    ServerSideEncryptionConfiguration={
        'Rules': [{'ApplyServerSideEncryptionByDefault': {
            'SSEAlgorithm': 'aws:kms',
            'KMSMasterKeyID': 'arn:aws:kms:...'
        }}]
    }
)
```

### RDS/Aurora
```bash
# Aurora Serverless v2 for variable workloads
aws rds create-db-cluster \
  --db-cluster-identifier mydb-cluster \
  --engine aurora-postgresql \
  --engine-version 14.6 \
  --master-username admin \
  --master-user-password <password> \
  --serverless-v2-scaling-configuration '{
    "MinCapacity": 0.5,
    "MaxCapacity": 16
  }' \
  --backup-retention-period 7 \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'

# Read replicas for read-heavy workloads
# Multi-AZ for high availability
# Parameter groups for performance tuning
```

## IAM Security Best Practices

```json
// Least privilege policy example
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::my-bucket/app-data/*",
    "Condition": {
      "StringEquals": {
        "s3:x-amz-server-side-encryption": "aws:kms"
      }
    }
  }]
}

// Service role with boundary
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Condition": {
      "StringEquals": {
        "sts:ExternalId": "unique-external-id"
      }
    }
  }]
}
```

## Cost Optimization Strategies

1. **Compute Savings**
   - Savings Plans: 72% savings for 1-3 year commit
   - Spot Instances: 90% savings for fault-tolerant workloads
   - Right-sizing: Use Compute Optimizer recommendations
   - Graviton processors: 20% better price-performance

2. **Storage Optimization**
   - S3 Intelligent-Tiering: Automatic cost optimization
   - EBS gp3: 20% cheaper than gp2, adjustable IOPS
   - Snapshot lifecycle: Delete old snapshots
   - S3 analytics: Identify access patterns

3. **Data Transfer**
   - CloudFront for caching: Reduce origin requests
   - VPC Endpoints: Avoid NAT Gateway charges
   - S3 Transfer Acceleration: Only when needed
   - Inter-region replication: Evaluate necessity

4. **Monitoring Tools**
   - AWS Cost Explorer: Trend analysis
   - AWS Budgets: Alerts and forecasts
   - Trusted Advisor: Best practice checks
   - Cost Anomaly Detection: Unusual spend alerts

## Architecture Patterns

**Three-tier web app:**
- Internet Gateway → ALB (public) → ECS/EC2 (private) → RDS Aurora (database subnet)
- Auto Scaling for web tier
- Read replicas for database
- ElastiCache for session storage

**Serverless event-driven:**
- API Gateway → Lambda → DynamoDB
- S3 events → Lambda → processing
- EventBridge for orchestration
- Step Functions for workflows

**Hybrid connectivity:**
- AWS Direct Connect or VPN
- Transit Gateway for multi-VPC
- Route 53 for DNS resolution
- PrivateLink for service access
