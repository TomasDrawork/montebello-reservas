output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
  description = "URL pública HTTPS para acceder al sitio web mediante CloudFront"
}

output "custom_domain_url" {
  value       = "https://reservasmontebello.com"
  description = "URL pública de producción con dominio personalizado"
}

output "admin_panel_url" {
  value       = "https://reservasmontebello.com/admin.html"
  description = "URL pública del Panel de Administración Staff"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "Nombre del bucket S3 de almacenamiento"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.cdn.id
  description = "ID de la distribución de CloudFront"
}

