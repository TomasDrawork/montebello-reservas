output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
  description = "URL pública HTTPS para acceder al sitio web"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "Nombre del bucket S3 de almacenamiento"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.cdn.id
  description = "ID de la distribución de CloudFront"
}
