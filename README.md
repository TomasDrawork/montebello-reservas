<div align="center">

  # 🍷 Club Montebello — Sistema de Reservas & Rooftop Experience

  <p align="center">
    <b>Aplicación web interactiva de solicitudes de reserva gastronómica de alta gama, desplegada sobre infraestructura AWS con Terraform.</b>
  </p>

  [![AWS CloudFront](https://img.shields.io/badge/AWS-CloudFront%20CDN-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/cloudfront/)
  [![AWS S3](https://img.shields.io/badge/AWS-S3%20Storage-red?style=for-the-badge&logo=amazon-s3)](https://aws.amazon.com/s3/)
  [![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform)](https://www.terraform.io/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Características Principales

* 📱 **Diseño 100% Responsivo & Mobile-First**: Experiencia adaptada a teléfonos móviles, tablets y computadoras de escritorio.
* 🎨 **Estética Fine Dining**: Paleta cromática inspirada en tonos atardecer cobre y carbón obsidiana, con tipografías de alta gama (*Montserrat* para encabezados y *Poppins* para cuerpo).
* 👥 **Selección de Comensales Dinámica**: Contador táctil e intuitivo con soporte de 1 a 20+ personas.
* 📅 **Carrusel de Fechas & Calendario Completo**: Visualización de días disponibles, días de descanso (Lunes y Martes cerrados) y navegación mensual.
* 💬 **Integración con WhatsApp Business**: Generación y envío automático de mensajes formateados directamente al canal de atención del restaurante.
* ☁️ **Infraestructura como Código (IaC)**: Despliegue automatizado en **AWS** con Terraform (S3 Bucket privado + CloudFront CDN + Origin Access Control OAC).

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología / Herramienta | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / Vanilla CSS3 / JS ES6+ | Arquitectura nativa rápida sin sobrecarga de frameworks. |
| **Tipografía** | Google Fonts (*Montserrat* & *Poppins*) | Tipografías elegantes seleccionadas para alta legibilidad. |
| **Infraestructura** | AWS S3 & CloudFront CDN | Almacenamiento seguro y distribución global ultrarrápida con SSL/HTTPS. |
| **Aprovisionamiento** | Terraform (HashiCorp) | Gestión de infraestructura replicable y segura como código. |
| **Automation** | Bash Deployment Script | Script `./deploy.sh` de sincronización e invalidación de caché en 1 clic. |

---

## 📁 Estructura del Repositorio

```text
montebello-reservas/
├── index.html              # Estructura principal HTML5 del widget de reservas
├── styles.css              # Sistema de diseño CSS3 (Variables, Glassmorphism, Responsivo)
├── app.js                  # Lógica de estado de aplicación, fechas y flujo de WhatsApp
├── deploy.sh               # Script automatizado de despliegue a AWS (Terraform + Sync + Invalidation)
├── package.json            # Configuración del proyecto y scripts npm
├── fondo-panoramico.jpg    # Fotografía panorámica del restaurante
├── fondo-nuevo.jpg         # Imagen alternativa de fondo
├── docs/                   # Documentación adicional y estimaciones de costos AWS
└── terraform/              # Módulos de Infraestructura como Código (IaC)
    ├── main.tf             # Configuración del proveedor AWS y tags globales
    ├── variables.tf        # Variables del bucket S3 y región de AWS
    ├── s3.tf               # Bucket S3 privado y políticas de acceso OAC
    ├── cloudfront.tf       # Distribución CDN CloudFront con certificado SSL
    └── outputs.tf          # Outputs de URLs y IDs de distribución
```

---

## 🚀 Desarrollo Local

Para correr el proyecto localmente en tu computadora con recarga automática (*Live Reload*):

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tomasipd98/montebello-reservas.git
   cd montebello-reservas
   ```

2. **Iniciar el servidor local de desarrollo:**
   ```bash
   npm start
   ```
   *O usando el servidor nativo de Python:*
   ```bash
   python3 -m http.server 8080
   ```

3. **Abrir en el navegador:**
   Navega a `http://localhost:8080` (o el puerto indicado por el terminal).

---

## ☁️ Despliegue en AWS en 1 Clic

El proyecto cuenta con un script de despliegue automatizado `./deploy.sh` que ejecuta en secuencia:

1. **Terraform Apply**: Aprovisiona o actualiza el Bucket S3 y CloudFront en AWS.
2. **AWS S3 Sync**: Subirá y sincronizará únicamente los archivos estáticos necesarios.
3. **CloudFront Invalidation**: Invalidará la caché `/*` para publicar los cambios de forma instantánea a nivel global.

Para ejecutar el despliegue:
```bash
./deploy.sh
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<div align="center">
  <sub>Desarrollado con ❤️ para <b>Club Montebello — Villa Carlos Paz</b></sub>
</div>
