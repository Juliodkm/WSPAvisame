# WSPAvisame - Notificaciones Bancarias a WhatsApp

Un bot que monitorea los correos electrónicos de una cuenta de Gmail en busca de notificaciones del BCP (Banco de Crédito del Perú) y las envía como alertas a un número de WhatsApp. El bot filtra los correos por fecha (solo procesa los correos del día actual) y por remitente.

## Requisitos

*   **Node.js:** Asegúrate de tener Node.js instalado en tu sistema.
*   **Cuenta de Gmail:** Necesitarás una cuenta de Gmail con una **"Contraseña de Aplicación"** habilitada. No uses tu contraseña principal. Puedes generar una Contraseña de Aplicación desde la configuración de seguridad de tu cuenta de Google.

## Instalación

Sigue estos pasos para poner en marcha el bot:

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd WSPAvisame
    ```

2.  **Instalar dependencias:**
    Ejecuta el siguiente comando para instalar todas las librerías necesarias.
    ```bash
    npm install
    ```

3.  **Configurar las variables de entorno:**
    Copia el archivo de ejemplo `.env.example` a un nuevo archivo llamado `.env`.
    ```bash
    copy .env.example .env
    ```
    Luego, abre el archivo `.env` y rellena tus credenciales:
    *   `GMAIL_USER`: Tu dirección de correo de Gmail.
    *   `GMAIL_APP_PASSWORD`: Tu Contraseña de Aplicación de Gmail.
    *   `WHATSAPP_RECIPIENT`: El número de WhatsApp que recibirá las notificaciones (en formato `xxxxxxxxxx@c.us`, por ejemplo: `51987654321@c.us`).

4.  **Iniciar el bot:**
    Ejecuta el siguiente comando para iniciar el bot.
    ```bash
    npm start
    ```
    La primera vez que lo ejecutes, se generará un código QR en la terminal. Escanéalo con la aplicación de WhatsApp en tu teléfono para vincular tu cuenta.

## Nota de Privacidad

Tus credenciales de Gmail y la sesión de WhatsApp se almacenan localmente en tu máquina dentro de los archivos `.env` y la carpeta `.wwebjs_auth` respectivamente. **Estos datos son privados y no se suben a ningún servicio en la nube.** El archivo `.gitignore` está configurado para evitar que estos archivos sensibles se compartan accidentalmente en un repositorio de Git.
