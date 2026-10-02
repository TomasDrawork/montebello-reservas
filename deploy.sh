#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Restaurante Montebello Reservas..."

# 1. Aplicar la infraestructura con Terraform
cd terraform
echo "📦 Aplicando infraestructura en AWS con Terraform..."
terraform apply -auto-approve

# 2. Obtener variables del output de Terraform
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)

cd ..

# 3. Subir archivos web al Bucket S3
echo "📤 Sincronizando archivos al bucket S3 (${BUCKET_NAME})..."
aws s3 sync . s3://${BUCKET_NAME} \
  --exclude "terraform/*" \
  --exclude ".git/*" \
  --exclude "docs/*" \
  --exclude "deploy.sh" \
  --delete

# 4. Invalidación de caché en CloudFront para actualizar cambios inmediatamente
echo "🔄 Invalidando caché de CloudFront (${CLOUDFRONT_ID})..."
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*" > /dev/null

echo "--------------------------------------------------------"
echo "✅ ¡Despliegue exitoso!"
echo "🌐 URL pública HTTPS de tu sitio web: ${CLOUDFRONT_URL}"
echo "--------------------------------------------------------"
