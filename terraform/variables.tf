variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Región de AWS para desplegar la infraestructura"
}

variable "bucket_name" {
  type        = string
  default     = "montebello-reservas-staging-756808989980"
  description = "Nombre único del bucket S3 para alojar la web estática"
}

# Secretos del panel/editor: se cargan en terraform/terraform.tfvars (ignorado por git)
variable "admin_password" {
  type        = string
  sensitive   = true
  description = "Contraseña única de acceso al panel de reservas y al editor de carta"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "Clave para firmar las sesiones del staff (texto aleatorio largo)"
}
