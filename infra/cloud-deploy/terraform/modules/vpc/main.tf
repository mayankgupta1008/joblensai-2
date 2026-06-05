# ─────────────────────────────────────────────────────────────
# Custom VPC
# DNS support + hostnames are REQUIRED — Cloud Map private DNS
# (aws_service_discovery_private_dns_namespace "joblensai") only
# resolves internal A records (auth.joblensai → task IP) when the
# VPC has DNS resolution enabled.
# ─────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.name}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-igw" }
}

# ─────────────────────────────────────────────────────────────
# Public subnets — one per AZ. Host the ALB and the NAT gateways.
# map_public_ip_on_launch so the NAT gateways get reachable EIPs.
# CIDRs: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
# ─────────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.name}-public-${var.availability_zones[count.index]}" }
}

# ─────────────────────────────────────────────────────────────
# Private subnets — one per AZ. Host ECS tasks + EC2 instances.
# No public IPs; egress via the per-AZ NAT gateway.
# CIDRs: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
# ─────────────────────────────────────────────────────────────
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${var.name}-private-${var.availability_zones[count.index]}" }
}

# ─────────────────────────────────────────────────────────────
# NAT gateways — one per AZ (Option C: HA egress). Each lives in
# that AZ's public subnet with its own Elastic IP. An AZ failure
# only kills that AZ's egress; other AZs keep reaching the internet.
# ─────────────────────────────────────────────────────────────
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"
  tags   = { Name = "${var.name}-nat-eip-${var.availability_zones[count.index]}" }
}

resource "aws_nat_gateway" "nat" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = { Name = "${var.name}-nat-${var.availability_zones[count.index]}" }

  # NAT needs the IGW route in place before it can function.
  depends_on = [aws_internet_gateway.igw]
}

# ─────────────────────────────────────────────────────────────
# Routing
# Public: single route table → IGW, shared by all public subnets.
# Private: one route table PER AZ → that AZ's NAT (no cross-AZ
# egress, so an AZ outage is isolated).
# ─────────────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = { Name = "${var.name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }

  tags = { Name = "${var.name}-private-rt-${var.availability_zones[count.index]}" }
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
