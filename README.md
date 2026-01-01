# WSPAvisame 🤖💸

**WSPAvisame** es un bot automatizado desarrollado en Node.js que monitorea tu bandeja de entrada de Gmail en tiempo real. Su función principal es detectar correos de transferencias bancarias (específicamente del BCP), leer el monto y el detalle, y notificarte instantáneamente a tu WhatsApp personal.

---

## 🚀 ¿Cómo funciona el sistema?

El sistema opera en un ciclo continuo de 60 segundos bajo la siguiente lógica:

1.  **Conexión IMAP:** Se conecta de forma segura a Gmail usando `imap-simple`.
2.  **Filtro Inteligente de Tiempo:** Para evitar saturación, solo analiza los correos recibidos en las **últimas 24 horas**.
3.  **Filtrado de Remitente:** Verifica estrictamente que el correo provenga de `notificaciones@notificacionesbcp.com.pe`.
4.  **Sistema Anti-Spam (Memoria UID):**
    * Cada correo tiene un ID único (UID).
    * El bot memoriza el UID del último correo notificado.
    * Si vuelve a leer el mismo correo, lo ignora para no enviarte mensajes repetidos.
5.  **Extracción de Datos (Parsing):**
    * Convierte el HTML del correo en texto.
    * Usa **Expresiones Regulares (Regex)** avanzadas para encontrar el monto (ej: `*S/ 20.00*`), ignorando los asteriscos de las negritas.
6.  **Notificación WhatsApp:** Usa `whatsapp-web.js` (que simula un navegador Chrome) para enviar el mensaje formateado a tu celular.

---

## 📂 Estructura del Proyecto

* `src/index.js`: El cerebro del bot. Contiene toda la lógica de conexión, lectura y envío.
* `.wwebjs_auth/`: Carpeta (generada automáticamente) donde se guarda la sesión de WhatsApp para no escanear el QR cada vez.
* `.env`: Archivo de seguridad donde van tus claves (Correo, Contraseña de App, Número).
* `package.json`: Lista de dependencias (librerías) que el bot necesita para vivir.

---

## 🛠️ Instalación y Uso

Sigue estos pasos para ponerlo en marcha en tu computadora:

### 1. Requisitos
* Tener **Node.js** instalado.
* Una cuenta de Gmail con "Verificación de 2 pasos" activada y una **Contraseña de Aplicación** generada.

### 2. Instalación
Clona el proyecto e instala las librerías:

```bash
git clone [https://github.com/Juliodkm/WSPAvisame.git](https://github.com/Juliodkm/WSPAvisame.git)
cd WSPAvisame
npm install