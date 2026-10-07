#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Restaurante Montebello Reservas en AWS..."

# 1. Empaquetar backend para AWS Lambda
echo "📦 Empaquetando backend de reservas para AWS Lambda..."
zip -q -r terraform/lambda.zip server.js services imagenes package.json node_modules index.html app.js styles.css admin.html admin.js admin.css data

# 2. Aplicar la infraestructura con Terraform
cd terraform
echo "📦 Aplicando infraestructura en AWS con Terraform..."
terraform init -upgrade
terraform apply -auto-approve

# 3. Obtener variables del output de Terraform
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
CUSTOM_DOMAIN_URL=$(terraform output -raw custom_domain_url)
ADMIN_PANEL_URL=$(terraform output -raw admin_panel_url)

cd ..

# 4. Subir archivos web estáticos al Bucket S3
echo "📤 Sincronizando archivos al bucket S3 (${BUCKET_NAME})..."
aws s3 sync . s3://${BUCKET_NAME} \
  --exclude "terraform/*" \
  --exclude ".git/*" \
  --exclude "docs/*" \
  --exclude "deploy.sh" \
  --exclude "node_modules/*" \
  --delete

# 5. Invalidación de caché en CloudFront
echo "🔄 Invalidando caché de CloudFront (${CLOUDFRONT_ID})..."
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*" > /dev/null

echo "--------------------------------------------------------"
echo "✅ ¡Despliegue en AWS exitoso!"
echo "🌐 Dominio Principal: ${CUSTOM_DOMAIN_URL}"
echo "📱 Sitio Web Cliente: ${CUSTOM_DOMAIN_URL}"
echo "👨‍🍳 Panel de Administración Staff: ${ADMIN_PANEL_URL}"
echo "⚡ CDN Directo CloudFront: ${CLOUDFRONT_URL}"
echo "--------------------------------------------------------"

