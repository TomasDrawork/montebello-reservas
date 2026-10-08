<div align="center">

  # 🍷 Club Montebello — Sistema Full-Stack de Gestión de Reservas & Rooftop Experience

  <p align="center">
    <b>Plataforma web interactiva full-stack de solicitudes de reserva gastronómica de alta gama, con integración a WhatsApp Business, Panel de Administración Staff, persistencia en AWS DynamoDB y arquitectura Serverless sobre AWS con Terraform.</b>
  </p>

  [![AWS CloudFront](https://img.shields.io/badge/AWS-CloudFront%20CDN-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/cloudfront/)
  [![AWS Lambda](https://img.shields.io/badge/AWS-Lambda%20Serverless-FF9900?style=for-the-badge&logo=aws-lambda)](https://aws.amazon.com/lambda/)
  [![AWS DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-4053D6?style=for-the-badge&logo=amazondynamodb)](https://aws.amazon.com/dynamodb/)
  [![AWS S3](https://img.shields.io/badge/AWS-S3%20Storage-red?style=for-the-badge&logo=amazon-s3)](https://aws.amazon.com/s3/)
  [![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform)](https://www.terraform.io/)
  [![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Resumen del Proyecto

Este sistema fue diseñado y desarrollado a medida para **Club Montebello** (Villa Carlos Paz), brindando una experiencia digital de nivel internacional para la gestión de reservas en su espacio Rooftop. 

Combina un diseño UI/UX de alta gama con animaciones fluidas, arquitectura Serverless escalable en la nube (AWS), almacenamiento persistente NoSQL y un panel de control privado para el personal gastronómico.

---

## 🌟 Características Destacadas

* 📱 **Portal de Clientes (Fine Dining UI & Crossfade Animation):**
  * Interface 100% responsiva adaptada a dispositivos móviles con estética Glassmorphism.
  * **Transición de Fondo Fluida (Crossfade)**: Precarga inteligente de imágenes y aceleración por hardware (GPU) sin saltos ni demoras.
  * Selector intuitivo de comensales (1 a 20+ personas).
  * Carrusel interactivo de fechas con calendario mensual flotante.
  * **Turnos de Atención Configurados**:
    * ☀️ **Almuerzo**: Turno de mediodía
    * 🍷 **Cena Primer Turno**: 21:00 hs
    * 🍷 **Cena Segundo Turno**: 21:30 hs
  * **Tarjeta de Política de Ingreso**: Bloque informativo translúcido que diferencia las reservas fijos garantizadas del ingreso por orden de llegada (walk-in).
  * Generación automática de código único de reserva `MB-XXXX` e integración con WhatsApp.

* 👨‍🍳 **Panel de Administración Staff:**
  * Dashboard de control interactivo protegido por autenticación.
  * **Gestor Dinámico de Disponibilidad**: Calendario interactivo para bloquear/desbloquear fechas, alternar días de descanso y configurar turnos específicos (`Ambos Turnos`, `Solo Almuerzo`, `Solo Cena`, `Cerrado`).
  * **Navegación por Calendario**: Filtro y visualización de solicitudes por fecha específica (*Hoy, Mañana, Seleccionar Fecha*).
  * Métricas KPI en vivo: Comensales confirmados, solicitudes pendientes y total acumulado.
  * Acciones de 1-clic con notificaciones automáticas: **🟢 Aprobar** (con asignación de mesa/sector), **🔴 Rechazar** y **🗑️ Eliminar**.

* 💬 **Notificaciones e Integración Multicanal:**
  * Generación de mensajes formateados y notificaciones a clientes vía WhatsApp Business.
  * Envíos de correo transaccionales con plantillas HTML Fine Dining para confirmaciones y solicitudes pendientes.

* ☁️ **Infraestructura Serverless como Código (AWS + Terraform + DynamoDB):**
  * Persistencia de datos NoSQL en la nube con **AWS DynamoDB**.
  * Aprovisionamiento automatizado con **Terraform** (AWS Lambda, API Gateway, S3 Bucket y CloudFront CDN).
  * Enrutamiento seguro SSL/HTTPS en CDN global.

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / Vanilla CSS3 / JS ES6+ | Arquitectura nativa rápida sin sobrecarga de frameworks. |
| **Tipografía** | Google Fonts (*Cormorant Garamond*, *Outfit*, *Montserrat*, *Poppins*) | Tipografías elegidas para experiencia gastronómica de alta gama. |
| **Backend API** | Node.js / Express.js / `serverless-http` | REST API modular compatible con entorno local y AWS Lambda. |
| **Database** | AWS DynamoDB (`@aws-sdk/client-dynamodb`) | Almacenamiento NoSQL persistente y escalable en la nube. |
| **Notificaciones** | WhatsApp Business API & Nodemailer SMTP | Notificaciones directas vía WhatsApp y correo electrónico. |
| **Infraestructura** | AWS S3, CloudFront CDN, API Gateway, Lambda, DynamoDB | Distribución global ultrarrápida e infraestructura Serverless. |
| **IaC** | Terraform (HashiCorp) | Gestión de infraestructura replicable y segura como código. |
| **Despliegue** | Bash Automation Script | Script automatizado de empaquetado, aprovisionamiento e invalidación de caché CDN. |

---

## 🏛️ Arquitectura del Sistema

```text
                                [ Cliente / Usuario ]
                                          │
                                          ▼
                             [ AWS CloudFront CDN (HTTPS) ]
                                  │               │
                     ┌────────────┴───┐       ┌───┴────────────┐
                     │ Assets Web S3  │       │ API Gateway V2 │
                     └────────────────┘       └───────┬────────┘
                                                      │
                                                      ▼
                                              [ AWS Lambda Node.js ]
                                                      │
                                                      ▼
                                            [ AWS DynamoDB NoSQL ]
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
