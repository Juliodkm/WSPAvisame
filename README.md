# WSPAvisame 🤖💸

**WSPAvisame** es un bot de notificaciones automatizado, desarrollado en Node.js, que monitorea tu bandeja de entrada de Gmail en tiempo real. Su misión es detectar transferencias bancarias (específicamente del BCP), leer el monto y el detalle, y avisarte al instante vía WhatsApp.

---

## 🚀 ¿Cómo funciona el sistema?

El bot ejecuta un ciclo de vigilancia cada 60 segundos con la siguiente lógica:

1.  **Conexión Segura:** Se conecta a Gmail mediante el protocolo IMAP (`imap-simple`).
2.  **Filtro de Eficiencia:** Para evitar lentitud, solo analiza correos recibidos en las **últimas 24 horas**.
3.  **Validación de Origen:** Confirma que el remitente sea oficial (`notificaciones@notificacionesbcp.com.pe`).
4.  **Memoria Anti-Spam (UID):**
    * El sistema memoriza el identificador único (UID) del último correo procesado.
    * Si vuelve a encontrar el mismo correo, lo ignora para evitar notificaciones repetidas.
5.  **Decodificación (Parsing):**
    * Transforma el contenido HTML del correo a texto plano.
    * Utiliza **Expresiones Regulares (Regex)** para extraer datos clave (Monto y Cuenta), incluso si vienen con formato de negritas (ej: `*S/ 10.00*`).
6.  **Alerta WhatsApp:** Envía un mensaje formateado a tu celular usando `whatsapp-web.js` (sin costo de API).

---

## 📂 Estructura del Proyecto

* **`src/index.js`**: El núcleo del código. Maneja la conexión IMAP, la lógica de negocio y el envío de mensajes.
* **`.wwebjs_auth/`**: Carpeta de sesión de WhatsApp (se crea sola). Guarda tus credenciales para no escanear el QR a cada rato.
* **`.env`**: Archivo de variables de entorno. Aquí van tus claves secretas (no se sube a GitHub).
* **`.env.example`**: Plantilla de guía para configurar el archivo `.env`.

---

## 🛠️ Instalación y Configuración

### 1. Requisitos Previos
* **Node.js** instalado en tu PC.
* Cuenta de **Gmail** con "Verificación de 2 pasos" y una **Contraseña de Aplicación** generada.

### 2. Clonar e Instalar
```bash
git clone [https://github.com/Juliodkm/WSPAvisame.git](https://github.com/Juliodkm/WSPAvisame.git)
cd WSPAvisame
npm install