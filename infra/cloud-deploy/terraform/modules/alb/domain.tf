# ─────────────────────────────────────────────────────────────
# Route 53 hosted zone for the domain.
# After apply, point GoDaddy's nameservers at this zone's NS records.
# ─────────────────────────────────────────────────────────────
resource "aws_route53_zone" "main" {
  name = var.domain_name

  # Reuse a fixed nameserver set so destroy/recreate (nuke) keeps the same 4 NS
  # and the registrar delegation stays valid. Empty var → null → random NS.
  delegation_set_id = var.route53_delegation_set_id != "" ? var.route53_delegation_set_id : null
}

# ─────────────────────────────────────────────────────────────
# ACM public certificate for apex + wildcard, validated via DNS.
# Must be in the same region as the ALB (ap-south-1).
# ─────────────────────────────────────────────────────────────
resource "aws_acm_certificate" "cert" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS records that prove domain ownership to ACM.
# apex and wildcard share one identical record, so allow_overwrite avoids a clash.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# Blocks until ACM confirms the certificate is Issued.
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ─────────────────────────────────────────────────────────────
# HTTPS:443 listener — terminates TLS with the ACM cert,
# forwards to the same api-gateway target group as HTTP did.
# ─────────────────────────────────────────────────────────────
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.cert.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway.arn
  }
}

# ─────────────────────────────────────────────────────────────
# Alias records pointing the domain at the ALB.
# Alias (not CNAME) so the apex works and AWS tracks the ALB's IPs.
# ─────────────────────────────────────────────────────────────
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
