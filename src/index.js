require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const _ = require('lodash');

// --- CONFIGURACIÓN ---
const imapConfig = {
    imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        tls: true,
        authTimeout: 8000,
        tlsOptions: { rejectUnauthorized: false }
    }
};

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER;
const MONITORING_INTERVAL = 60000; // 60 segundos
const ALLOWED_SENDER = "notificaciones@notificacionesbcp.com.pe";

if (!WHATSAPP_NUMBER || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("CRITICAL: Faltan variables de entorno. El sistema no puede iniciar.");
    process.exit(1);
}

// --- VARIABLE DE MEMORIA ---
let ultimoUIDProcesado = null;

// --- CLIENTE DE WHATSAPP ---
console.log('Iniciando cliente de WhatsApp...');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escanee el QR para iniciar sesión.');
});

client.on('ready', () => {
    console.log('✅ Cliente de WhatsApp listo.');
    console.log('================================================================');
    console.log(`Iniciando monitoreo de correo cada ${MONITORING_INTERVAL / 1000} segundos.`);
    console.log('MODO FILTRO DE FECHA (SINCE): Buscando correos de las últimas 24 horas.');
    console.log('================================================================');
    checkRecentEmails();
    setInterval(checkRecentEmails, MONITORING_INTERVAL);
});

client.on('auth_failure', (msg) => console.error('CRITICAL: Fallo en la autenticación de WhatsApp:', msg));
client.on('disconnected', (reason) => console.warn('AVISO: Cliente de WhatsApp desconectado:', reason));

client.initialize();

async function checkRecentEmails() {
    let connection;
    try {
        // Definir el Filtro de Tiempo
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Clave: Configurar el criterio de búsqueda para ser ultra rápido
        const searchCriteria = [
            ['SINCE', yesterday.toISOString()],
            ['FROM', ALLOWED_SENDER] // Mantenemos el filtro de remitente por eficiencia
        ];

        console.log(`\nBuscando correos desde ${yesterday.toLocaleString()}...`);
        connection = await imaps.connect(imapConfig);
        await connection.openBox('INBOX');

        const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            console.log("No se encontraron correos recientes del BCP.");
            await connection.end();
            return;
        }

        // Obtener el Último correo de los resultados
        const lastMessage = messages.slice(-1)[0];
        
        // --- VALIDACIÓN DE UID PARA EVITAR REPETICIONES ---
        if (lastMessage.attributes.uid === ultimoUIDProcesado) {
            console.log('💤 Sin novedades. El último correo ya fue notificado.');
            await connection.end();
            return;
        }

        console.log(`Se encontraron ${messages.length} correos recientes. Analizando el último (UID: ${lastMessage.attributes.uid})...`);

        const header = lastMessage.parts.find(part => part.which === 'HEADER').body;
        const subject = header.subject ? header.subject[0] : 'Sin Asunto';
        const emailDate = new Date(lastMessage.attributes.date);

        console.log('------------------------------------------------');
        console.log(`📩 Procesando correo: ${subject}`);
        console.log(`⏰ Fecha: ${emailDate.toLocaleString()}`);

        const bodyPart = lastMessage.parts.find(part => part.which === '');
        if (!bodyPart) {
            console.log('⚠️ ADVERTENCIA: No se pudo encontrar el cuerpo completo del correo.');
            return;
        }
        
        simpleParser(bodyPart.body, async (err, parsed) => {
            if (err) {
                console.error('⚠️ ERROR PARSING:', err);
                return;
            }

            const textContent = parsed.text || '';
            
            // Depuración Visual del Texto Parseado
            console.log('--- INICIO DEL TEXTO PARSEADO ---');
            console.log(textContent.substring(0, 300) + '...');
            console.log('--- FIN DEL TEXTO PARSEADO ---');
            
            // Nuevas Regex para ignorar asteriscos y ser más flexible
            const regexMonto = /(?:Monto transferido|transferencia de)\s*\*?(?:S\/|USD|\$)\s?([\d,.]+)/i;
            const regexCuenta = /desde tu\s*\*?([a-zA-Z0-9\s]+)(?:\*|\.)/i;

            const amountMatch = textContent.match(regexMonto);
            const accountMatch = textContent.match(regexCuenta);
            
            if (amountMatch) {
                const montoDetectado = `S/ ${amountMatch[1]}`;
                const cuentaOrigen = accountMatch ? accountMatch[1].trim() : "No detectada";

                console.log(`   -> ÉXITO: Monto detectado: ${montoDetectado}`);
                console.log(`   -> Origen detectado: ${cuentaOrigen}`);
                
                const messageBody = `💰 *Transferencia Detectada*\n` +
                                  `📅 *Fecha:* ${emailDate.toLocaleTimeString()}\n` +
                                  `💸 *Monto:* ${montoDetectado}\n` +
                                  `💳 *Cuenta:* ${cuentaOrigen}\n` +
                                  `📝 *Asunto:* ${subject}`;

                const chatId = `${WHATSAPP_NUMBER}@c.us`;
                try {
                    await client.sendMessage(chatId, messageBody);
                    console.log('✅ Notificación enviada por WhatsApp.');
                    
                    // --- ACTUALIZACIÓN DE MEMORIA ---
                    ultimoUIDProcesado = lastMessage.attributes.uid;
                    console.log(`✅ Nuevo correo procesado (UID: ${ultimoUIDProcesado}). Actualizando memoria.`);

                } catch (whatsappError) {
                    console.error('CRITICAL: Error al enviar el mensaje de WhatsApp:', whatsappError);
                }
            } else {
                console.log('ℹ️ INFO: El último correo no contenía un monto de transferencia claro.');
            }
        });

    } catch (error) {
        console.error('CRITICAL: Error en el ciclo de monitoreo:', error.stack);
    } finally {
        if (connection && connection.state !== 'disconnected') {
            await connection.end();
        }
    }
}
