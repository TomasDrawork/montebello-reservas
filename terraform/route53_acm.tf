# Data source para obtener la Hosted Zone de Route 53 registrada
data "aws_route53_zone" "main" {
  name         = "reservasmontebello.com"
  private_zone = false
}

# Certificado SSL/TLS gratuito en AWS Certificate Manager (debe ser us-east-1 para CloudFront)
resource "aws_acm_certificate" "cert" {
  domain_name       = "reservasmontebello.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "www.reservasmontebello.com"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Registros DNS en Route 53 para validar la propiedad del dominio ante ACM
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Validación del Certificado ACM mediante DNS
resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Registros Alias A y AAAA para reservasmontebello.com (Apex) -> CloudFront
resource "aws_route53_record" "apex_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "reservasmontebello.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "apex_aaaa" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "reservasmontebello.com"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# Registros Alias A y AAAA para www.reservasmontebello.com -> CloudFront
resource "aws_route53_record" "www_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.reservasmontebello.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_aaaa" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.reservasmontebello.com"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
