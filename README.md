<div align="center">

  # 🍷 Club Montebello — Sistema Full-Stack de Gestión de Reservas & Rooftop Experience

  <p align="center">
    <b>Plataforma web interactiva full-stack de solicitudes de reserva gastronómica de alta gama, con confirmaciones automáticas por email, Panel de Administración Staff y despliegue Serverless sobre infraestructura AWS con Terraform.</b>
  </p>

  [![AWS CloudFront](https://img.shields.io/badge/AWS-CloudFront%20CDN-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/cloudfront/)
  [![AWS Lambda](https://img.shields.io/badge/AWS-Lambda%20Serverless-FF9900?style=for-the-badge&logo=aws-lambda)](https://aws.amazon.com/lambda/)
  [![AWS S3](https://img.shields.io/badge/AWS-S3%20Storage-red?style=for-the-badge&logo=amazon-s3)](https://aws.amazon.com/s3/)
  [![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform)](https://www.terraform.io/)
  [![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Características Principales

* 📱 **Portal de Clientes (Fine Dining UI):**
  * Diseño 100% responsivo y adaptado a dispositivos móviles.
  * Selector intuitivo de comensales (1 a 20+ personas).
  * Carrusel interactivo de fechas con días de descanso preconfigurados (Lunes y Martes).
  * Selección de turnos de cena y preferencia de sector (*Rooftop, Balcón, Interior*).
  * Confirmación de solicitud instantánea con código único de reserva `MB-XXXX`.

* 👨‍🍳 **Panel de Administración Staff (`/admin.html`):**
  * Dashboard de control protegido por contraseña de acceso.
  * **Barra de Navegación por Calendario:** Filtra y visualiza reservas por día específico (*Hoy, Mañana, Seleccionar Fecha*).
  * Métricas KPI dinámicas en vivo: Comensales confirmados, solicitudes pendientes y total acumulado.
  * Pestañas de estado: *Todas, Pendientes, Confirmadas y Rechazadas*.
  * Acciones de 1-clic: **🟢 Aprobar Mesa** (con asignación de número de mesa/sector), **🔴 Rechazar** y **🗑️ Eliminar Reserva**.
  * Actualización en tiempo real (*polling continuo de 10s*).

* 📧 **Servicio de Notificaciones Automáticas por Email:**
  * Integración con Gmail SMTP (`reservas.montebellovcp@gmail.com`).
  * Plantillas HTML responsive con diseño Fine Dining (paleta cobre, carbón obsidiana, Google Fonts *Montserrat* y *Poppins*):
    * ⏳ **Solicitud Recibida:** Notifica al cliente que su mesa está en revisión.
    * ✅ **Reserva Confirmada:** Envía el código de reserva, mesa asignada, tolerancia de 15 min y enlace a Google Maps.
    * ❌ **Reserva Rechazada:** Notificación amable sobre la disponibilidad del turno.

* ☁️ **Infraestructura Serverless como Código (AWS + Terraform):**
  * Aprovisionamiento automatizado de AWS Lambda, API Gateway HTTP API, S3 Bucket y CloudFront CDN.
  * SSL/HTTPS preconfigurado con enrutamiento dinámico `/api/*` hacia Lambda y assets estáticos hacia S3.

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / Vanilla CSS3 / JS ES6+ | Arquitectura nativa rápida sin sobrecarga de frameworks. |
| **Tipografía** | Google Fonts (*Montserrat* & *Poppins*) | Tipografías elegantes para experiencia de alta gama. |
| **Backend API** | Node.js / Express.js / `serverless-http` | REST API modular compatible con entorno local y AWS Lambda. |
| **Email Engine** | Nodemailer (Gmail SMTP / AWS SES) | Envíos transaccionales con plantillas HTML Fine Dining. |
| **Infraestructura** | AWS S3, CloudFront CDN, API Gateway, Lambda | Distribución global ultrarrápida e infraestructura Serverless. |
| **IaC** | Terraform (HashiCorp) | Gestión de infraestructura replicable y segura como código. |
| **Despliegue** | Bash Script (`./deploy.sh`) | Script de empaquetado, aprovisionamiento e invalidación de caché en 1 clic. |

---

## 📁 Estructura del Repositorio

```text
montebello-reservas/
├── index.html              # Widget web principal para solicitudes de clientes
├── app.js                  # Lógica cliente y conexión con la API REST
├── styles.css              # Sistema de diseño CSS (Variables, Fine Dining Theme)
├── admin.html              # Dashboard de administración para el staff del restaurante
├── admin.js                # Lógica del panel admin, filtros de fecha y acciones
├── admin.css               # Estilos del panel de administración
├── server.js               # Servidor Backend Express (Endpoints API & Handler Lambda)
├── package.json            # Dependencias del servidor Node.js y scripts npm
├── deploy.sh               # Script automatizado de empaquetado y despliegue a AWS
├── services/               # Servicios del backend
│   └── emailService.js     # Motor de notificaciones por email con plantillas HTML
├── data/                   # Almacenamiento local de reservas en desarrollo
│   └── reservations.json   # Historial de reservas (ignorado en git/producción)
├── imagenes/               # Fotografía oficial y recursos gráficos del restaurante
│   ├── fondo-panoramico.jpg
│   ├── fondo-nuevo.jpg
│   └── official-logo.png
├── terraform/              # Módulos de Infraestructura como Código (IaC)
│   ├── main.tf             # Proveedor AWS y etiquetas globales
│   ├── variables.tf        # Variables de región y bucket S3
│   ├── s3.tf               # Bucket S3 privado y políticas OAC
│   ├── cloudfront.tf       # Distribución CDN CloudFront con SSL/HTTPS
│   ├── backend.tf          # Configuración de AWS Lambda y API Gateway
│   └── outputs.tf          # Outputs de URLs públicas y IDs de distribución
└── docs/                   # Documentación adicional y estimaciones de costos AWS
```

---

## 🚀 Desarrollo Local

Para ejecutar la aplicación localmente en tu computadora:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TomasDrawork/montebello-reservas.git
   cd montebello-reservas
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor backend local:**
   ```bash
   npm start
   ```

4. **Abrir en el navegador:**
   * 📱 **Web de Clientes:** `http://localhost:3001`
   * 👨‍🍳 **Panel Admin Staff:** `http://localhost:3001/admin.html` *(Contraseña por defecto: `montebello2026`)*

---

## ☁️ Despliegue Automatizado en AWS en 1 Clic

El proyecto incluye un script ejecutable `./deploy.sh` que automatiza todo el proceso:

1. **Empaquetado Lambda:** Compila el backend y dependencias en `terraform/lambda.zip`.
2. **Terraform Apply:** Aprovisiona/Actualiza S3, CloudFront, API Gateway y AWS Lambda.
3. **AWS S3 Sync:** Subirá los archivos frontend al bucket de almacenamiento.
4. **CloudFront Invalidation:** Invalida la caché `/*` para publicar cambios al instante.

Para ejecutar el despliegue:
```bash
./deploy.sh
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
