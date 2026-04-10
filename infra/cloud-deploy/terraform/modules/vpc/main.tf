# ---------------------------------------------------------------
# VPC
# Your isolated private network on AWS. Everything lives inside.
# enable_dns_hostnames → EC2 instances get DNS names (needed for ECS)
# enable_dns_support   → enables AWS DNS resolver inside the VPC
# ---------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Internet Gateway
# The door between your VPC and the public internet.
# Public subnets route outbound traffic through this.
# ---------------------------------------------------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Public Subnets (one per AZ)
# ALB lives here. Receives traffic from the internet.
# map_public_ip_on_launch → instances here get a public IP automatically
# count.index → loops over the list: creates subnet-1 and subnet-2
# ---------------------------------------------------------------
resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Private Subnets (one per AZ)
# ECS tasks (your microservices) live here.
# No direct inbound from internet. Outbound via NAT Gateway.
# ---------------------------------------------------------------
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Elastic IP for NAT Gateway
# A static public IP address assigned to the NAT Gateway.
# domain = "vpc" → required for use inside a VPC
# depends_on → IGW must exist before we allocate this EIP
# ---------------------------------------------------------------
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# ---------------------------------------------------------------
# NAT Gateway
# Sits in a public subnet. Lets private subnet resources make
# outbound internet requests (pulling ECR images, calling APIs)
# without being reachable from the internet themselves.
# Only one NAT Gateway needed — cost saving over one per AZ.
# ---------------------------------------------------------------
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# ---------------------------------------------------------------
# Public Route Table
# Rule: all internet traffic (0.0.0.0/0) → go via IGW
# ---------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Private Route Table
# Rule: all internet traffic (0.0.0.0/0) → go via NAT Gateway
# ---------------------------------------------------------------
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-rt"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Route Table Associations
# Links each subnet to its route table.
# Without this, subnets use the default VPC route table.
# ---------------------------------------------------------------
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
