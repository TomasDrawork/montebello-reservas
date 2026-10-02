variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Región de AWS para desplegar la infraestructura"
}

variable "bucket_name" {
  type        = string
  default     = "montebello-reservas-staging-560615624375"
  description = "Nombre único del bucket S3 para alojar la web estática"
}
