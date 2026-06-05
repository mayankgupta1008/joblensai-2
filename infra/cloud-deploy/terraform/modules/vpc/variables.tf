variable "name" {
  description = "Name prefix for VPC resources (e.g. joblensai)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC. /16 leaves room for /24 subnets per AZ."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to spread subnets + NAT gateways across (one public + one private subnet, and one NAT, per AZ)"
  type        = list(string)
}
