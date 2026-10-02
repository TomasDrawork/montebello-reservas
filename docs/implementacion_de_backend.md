# 🚀 Plan de Propuesta: Implementación de Backend Autónomo para Restaurante Montebello

Documento técnico y estratégico para la evolución del sistema de reservas hacia una **Plataforma 100% Autogestionada sin confirmación manual**.

---

## 🎯 Objetivo de la Propuesta

Si el restaurante desea automatizar al 100% la recepción y confirmación de reservas sin necesidad de que el personal responda mensajes manualmente en WhatsApp, se puede implementar un backend Serverless en AWS que gestione cupos, confirmaciones e informes automáticos.

---

## 🏗️ Arquitectura del Backend en AWS (Serverless)

```
[Cliente en la Web] ──> [Amazon API Gateway] ──> [AWS Lambda] ──> [Amazon DynamoDB]
                                                      │
                                                      ├──> [Google Calendar / Sheets API]
                                                      └──> [Notificación por WhatsApp/Email]
```

### 1. Amazon DynamoDB (Base de Datos Serverless)
- **Función:** Almacena de forma permanente todas las solicitudes de reservas.
- **Estructura de Datos:** Cada reserva guarda: `ID`, `Cliente`, `Teléfono`, `Comensales`, `Fecha`, `Hora`, `Ubicación Preferida`, `Estado` (`CONFIRMADA`, `CANCELADA`, `COMPLETADA`).
- **Costo AWS:** **$0.00 USD / mes** (Incluido en la capa gratuita de hasta 25 GB de DynamoDB).

### 2. AWS Lambda + API Gateway (Lógica del Sistema)
- **Función:** Procesa las solicitudes recibidas desde la página web, verifica si quedan mesas disponibles para ese turno y actualiza el estado de las reservas.
- **Costo AWS:** **$0.00 USD / mes** (Incluido en el Free Tier de hasta 1,000,000 de peticiones mensuales).

---

## 🖥️ ¿Cómo Consultaría y Gestionaría las Reservas el Restaurante?

Se proponen **3 alternativas** según la preferencia de la gerencia:

### **Alternativa A: Dashboard Web Administrador (`admin.montebello.com`)**
- **Acceso:** Inicio de sesión seguro con usuario y contraseña para el encargado/mozos.
- **Vista de Agenda:** Pantalla con la lista de mesas y horarios del día (Mediodía / Noche).
- **Reportes:** Botón para **"Descargar lista del día en Excel / PDF"** con 1 solo clic.
- **Control de Capacidad:** Opción para "Bloquear fecha/horario" si el salón está completo por un evento privado.

### **Alternativa B: Sincronización Automática con Google Calendar & Sheets**
- **Acceso:** Cada reserva realizada en la web se escribe automáticamente como un renglón en un **Google Sheet** y crea el evento en el **Google Calendar** del restaurante.
- **Ventaja:** El encargado solo abre la app de Google Calendar en su celular y ve las reservas agendadas hora por hora.

### **Alternativa C: Confirmación y Notificación Automática por WhatsApp Bot**
- El sistema confirma la reserva en pantalla inmediatamente.
- Envía un mensaje automático de confirmación al WhatsApp del cliente con los datos de su mesa y un botón para cancelar si no puede asistir.
- El personal del restaurante recibe un resumen diario automático a las 11:00 am con la lista de comensales esperados.

---

## 💵 Estimación Financiera del Backend

| Componente | Capa Gratuita AWS | Costo Mensual Estimado |
| :--- | :--- | :--- |
| **Amazon DynamoDB** | 25 GB Gratis | **$0.00 USD** |
| **AWS Lambda** | 1,000,000 ejecuciones/mes | **$0.00 USD** |
| **Amazon API Gateway** | 1,000,000 llamadas/mes | **$0.00 USD** |
| **Hosting Frontend (S3 + CloudFront)** | 1 TB transferencia gratis | **~$0.01 USD** |

### **Costo Total Estimado AWS Backend:** **~$0.00 a $0.50 USD / mes**

---

## 📌 Recomendación de Implementación

1. **Fase 1 (Actual):** Desplegar la versión estática con redirección directa a WhatsApp (`wa.me`) para probar la adopción de los clientes y validar el flujo.
2. **Fase 2 (Evolución):** Si el volumen de reservas aumenta y responder WhatsApp se vuelve pesado, activar la API Lambda + DynamoDB y el Dashboard Administrador.
