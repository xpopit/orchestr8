---
id: workflow-optimize-costs
category: pattern
tags: [workflow, cost-optimization, cloud, aws, gcp, azure, finops, resource-management, efficiency]
capabilities:
  - Comprehensive cost analysis and optimization
  - Resource rightsizing and elimination
  - Cloud cost reduction strategies
  - Continuous cost monitoring setup
useWhen:
  - Cost optimization requiring resource analysis, usage pattern identification, right-sizing recommendations, and savings validation
  - Cloud cost reduction needing waste elimination, reserved instance planning, and continuous optimization monitoring
estimatedTokens: 520
---

# Cost Optimization Workflow Pattern

**Approach:** Analyze → Identify Waste → Optimize → Monitor

**Phases:** Analysis (0-25%) → Quick Wins (25-50%) → Deep Optimization (50-80%) → Monitoring (80-100%)

## Phase 1: Cost Analysis (0-25%)
**Parallel tracks:**

**Track A: Current State (0-15%)**
- Pull cost reports (AWS Cost Explorer, GCP Billing, Azure Cost Management)
- Identify top cost drivers (compute, storage, network, database)
- Calculate cost per service/team/environment
- Find cost trends and anomalies

**Track B: Resource Inventory (10-25%)**
- List all resources (instances, volumes, databases, IPs, load balancers)
- Tag resources (owner, environment, project)
- Identify untagged/orphaned resources
- Check utilization metrics (CPU, memory, disk, network)

**Checkpoint:** Cost baseline documented, waste identified

## Phase 2: Quick Wins (25-50%)
**Immediate savings (no code changes):**

**Track A: Eliminate Waste (25-35%)**
- Delete: Orphaned volumes, unused snapshots, old AMIs
- Release: Unattached IPs, unused load balancers
- Stop: Non-production resources during off-hours
- Remove: Duplicate resources, test environments

**Track B: Rightsizing (30-45%)**
- Downsize over-provisioned instances (CPU <20% avg)
- Use burstable instances for variable workloads (t3, t4g)
- Consolidate underutilized resources
- Switch to ARM-based instances (Graviton, 20% cheaper)

**Track C: Storage Optimization (35-50%)**
- Lifecycle policies (move to cold storage after 30/90 days)
- Delete old logs and backups
- Use compression for backups
- Switch to cheaper storage classes (S3 Intelligent-Tiering)

**Checkpoint:** 20-40% cost reduction achieved

## Phase 3: Deep Optimization (50-80%)
**Requires code/config changes:**

**Track A: Compute (50-65%)**
- Reserved Instances (1-year: 40% savings, 3-year: 60%)
- Savings Plans for flexible commitment
- Spot instances for fault-tolerant workloads (70-90% savings)
- Autoscaling policies (scale down aggressively)
- Serverless for sporadic workloads (Lambda, Cloud Functions)

**Track B: Database (55-70%)**
- Rightsize database instances
- Use read replicas instead of oversized primary
- Auto-pause for dev databases (Aurora Serverless)
- Connection pooling to reduce instance count
- Archive old data to cheaper storage

**Track C: Network (60-75%)**
- Reduce cross-region traffic (use regional resources)
- CDN for static assets (reduce origin traffic)
- Direct Connect/VPN instead of internet bandwidth
- NAT Gateway consolidation
- Compress data in transit

**Track D: Architectural (65-80%)**
- Cache aggressively (Redis, CDN) to reduce compute
- Async processing (queues) to batch operations
- Multi-tenancy to share resources
- Resource pooling across services
- Efficient data formats (Parquet vs JSON)

**Checkpoint:** 40-60% total cost reduction

## Phase 4: Continuous Monitoring (80-100%)
**Prevent cost creep:**

**Track A: Alerts (80-90%)**
- Budget alerts (daily/weekly/monthly thresholds)
- Anomaly detection (unusual spend patterns)
- Unused resource alerts (idle >7 days)
- Cost per unit alerts ($/request, $/user)

**Track B: Governance (85-95%)**
- Tagging policies (require owner, environment, project)
- Resource quotas per team
- Approval workflows for expensive resources
- Regular cost reviews (weekly/monthly)
- Cost allocation reports by team/product

**Track C: Optimization Automation (90-100%)**
- Auto-stop dev/test resources (evenings, weekends)
- Auto-delete old snapshots/logs (>90 days)
- Auto-rightsize recommendations (weekly)
- Spot instance bidding automation
- **Checkpoint:** Cost controls enforced

## Cost Optimization Priorities
1. **Eliminate waste** (0-resource cost)
2. **Stop unused** (immediate savings)
3. **Rightsize** (same capability, lower cost)
4. **Reserved capacity** (commitment for discount)
5. **Spot instances** (fault-tolerant only)
6. **Architectural changes** (long-term efficiency)

## Cloud-Specific Tips
**AWS:**
- Use Cost Explorer and Trusted Advisor
- Graviton instances (20% cheaper)
- S3 Intelligent-Tiering, Glacier
- Lambda instead of always-on instances

**GCP:**
- Use Committed Use Discounts
- Preemptible VMs (similar to Spot)
- Coldline/Archive storage
- Cloud Run for variable workloads

**Azure:**
- Reserved VM Instances
- Spot VMs
- Cool/Archive blob storage
- Azure Functions consumption plan

## Success Criteria
- Cost baseline documented
- 40-60% cost reduction achieved
- All resources tagged
- Budget alerts configured
- Auto-stop policies active
- Monthly cost reviews scheduled
- Optimization playbook documented
