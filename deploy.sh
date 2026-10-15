#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Restaurante Montebello Reservas en AWS..."

# 1. Empaquetar backend para AWS Lambda
echo "📦 Empaquetando backend de reservas para AWS Lambda..."
zip -q -r terraform/lambda.zip server.js services imagenes package.json node_modules index.html app.js styles.css admin.html admin.js admin.css menu.json data

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

# 4. Subir SOLO los archivos web públicos al Bucket S3 (lista blanca)
#    ⚠️ Nunca subir credenciales, manuales, presupuestos, código backend ni data/.
#    Para publicar un archivo nuevo, agregarlo explícitamente con --include.
echo "📤 Sincronizando archivos públicos al bucket S3 (${BUCKET_NAME})..."
aws s3 sync . s3://${BUCKET_NAME} \
  --exclude "*" \
  --include "index.html" \
  --include "app.js" \
  --include "styles.css" \
  --include "carta.html" \
  --include "carta.js" \
  --include "carta.css" \
  --include "menu.json" \
  --include "admin.html" \
  --include "admin.js" \
  --include "admin.css" \
  --include "imagenes/*"

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

