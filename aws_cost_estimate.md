# 💰 Estimación de Costos en AWS (AWS Pricing Calculator)

Estimación mensual aproximada para el alojamiento y funcionamiento del sistema de reservas de **Restaurante Montebello** en la nube de Amazon Web Services (AWS).

---

## 📊 Resumen Ejecutivo de Costos Mensuales

| Servicio AWS | Concepto / Uso Estimado | Costo Mensual (USD) |
| :--- | :--- | :--- |
| **Amazon S3** | Almacenamiento de archivos web e imágenes (~10 MB) + Peticiones GET | **$0.01 USD** |
| **Amazon CloudFront** | CDN para HTTPS/SSL y aceleración global (Hasta 1 TB gratis/mes) | **$0.00 USD** *(Free Tier)* |
| **AWS Certificate Manager** | Certificado SSL de seguridad gratis para el dominio propio | **$0.00 USD** *(Gratis)* |
| **AWS Lambda** | Función Serverless para procesar reservas (~2,000 ejecuciones/mes) | **$0.00 USD** *(Free Tier: 1M gratis)* |
| **Amazon API Gateway** | API HTTP endpoint para conectar la web con Lambda | **$0.00 USD** *(Free Tier)* |
| **Route 53 (Opcional)** | Gestión de DNS del dominio (ej: `montebello.com`) | **$0.50 USD** / mes por zona |

### 💵 **TOTAL ESTIMADO AWS: $0.01 a $0.51 USD / mes** (Prácticamente GRATIS)

---

## 🔍 Desglose Técnico por Servicio

### 1. Amazon S3 (Static Website Hosting)
- **Almacenamiento:** ~10 MB de código HTML, CSS, JS e imágenes optimizadas.
  - Precio Estándar S3: $0.023 por GB -> 0.01 GB = **$0.00023 USD**.
- **Peticiones HTTP GET:** ~50,000 lecturas mensuales de archivos.
  - Precio: $0.0004 por cada 1,000 peticiones -> **$0.02 USD**.

### 2. Amazon CloudFront + ACM (HTTPS y Dominio Propio)
- **SSL (HTTPS):** Certificado de seguridad SSL encriptado con AWS Certificate Manager -> **$0.00 USD**.
- **Transferencia de Datos de Salida (Data Transfer Out):**
  - Tráfico estimado: 5,000 visitantes/mes × 2 MB = 10 GB/mes.
  - AWS incluye **1 TB (1,000 GB) de transferencia saliente 100% GRATIS todos los meses para siempre**.

### 3. AWS Lambda (Backend Serverless)
Si decides usar una función Lambda para enviar las reservas automáticamente al backend o activar un Webhook de WhatsApp:
- **Peticiones:** 2,000 solicitudes de reservas al mes.
  - AWS incluye **1,000,000 de peticiones gratis al mes para siempre**.
- **Tiempo de Cómputo (Compute Time):** 2,000 × 200 ms @ 128 MB RAM = 400 segundos.
  - AWS incluye **3.2 millones de segundos gratis al mes**.
- **Costo Lambda:** **$0.00 USD**.

---

## 📲 Costo de WhatsApp API (Meta Business)

Hay dos formas de manejar WhatsApp:

1. **Método Directo (`wa.me`):**
   - El cliente hace clic y abre su propia app de WhatsApp con el mensaje precargado.
   - **Costo:** **$0.00 USD** *(Cero costo adicional)*.

2. **Método Automatizado (Meta Cloud API oficial a través de Lambda):**
   - Meta cobra por conversaciones iniciadas por el negocio o de servicio.
   - **Capa Gratuita de Meta:** Meta otorga **1,000 conversaciones de servicio GRATIS al mes**.
   - Si superan las 1,000 reservas/mensajes al mes en el sistema oficial, cada conversación adicional en Argentina / Latinoamérica cuesta aprox. **$0.03 USD**.

---

## 🎯 Conclusión para tu Jefe

Es una propuesta económica imbatible:

> *"El costo de mantener esta infraestructura en AWS será de **menos de $1 USD al mes** (prácticamente $0 gracias a las capas gratuitas de AWS). No requiere servidores encendidos 24/7 y la seguridad con SSL está incluida gratuitamente."*
