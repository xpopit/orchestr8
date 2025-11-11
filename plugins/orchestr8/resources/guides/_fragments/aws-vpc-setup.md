---
id: aws-vpc-setup
category: guide
tags: [aws, vpc, networking, terraform, infrastructure]
capabilities:
  - AWS VPC configuration
  - Public/private subnets
  - NAT gateway setup
useWhen:
  - Provisioning production AWS VPC with Terraform requiring 3 availability zones for high availability and fault tolerance
  - Building AWS network architecture with public subnets for load balancers and private subnets for applications and databases
  - Setting up VPC with NAT gateways in each AZ for redundancy and private subnet internet access without single point of failure
  - Configuring AWS networking for EKS clusters requiring specific subnet tags for load balancer and internal ELB placement
  - Deploying VPC infrastructure with proper CIDR allocation (10.0.0.0/16) supporting growth with /24 subnets per AZ
  - Building cost-optimized AWS networks where single NAT gateway suffices for dev/staging but multi-AZ NAT needed for production
estimatedTokens: 450
---

# AWS VPC Setup with Terraform

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${var.project}-vpc" }
}

# Public subnets (for load balancers)
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name                     = "${var.project}-public-${count.index + 1}"
    "kubernetes.io/role/elb" = "1"
  }
}

# Private subnets (for applications)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = {
    Name                              = "${var.project}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

# NAT Gateway (one per AZ for HA)
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
}
```

**Cost Optimization:** Use single NAT gateway for dev/staging, multi-AZ for production.
