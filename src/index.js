require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const imaps = require('imap-simple');
const _ = require('lodash');

// --- CONFIGURACIÓN Y BARRERA DE TIEMPO ---
const SCRIPT_START_TIME = new Date();

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
    console.error("Error: Faltan variables de entorno. Asegúrate de que tu archivo .env esté completo.");
    process.exit(1);
}

// --- CLIENTE DE WHATSAPP ---
console.log('Inicializando cliente de WhatsApp...');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR para iniciar sesión.');
});

client.on('ready', async () => {
    console.log('✅ Cliente de WhatsApp está listo.');
    console.log('----------------------------------------------------------------');
    console.log(`🕒 Sistema iniciado: ${SCRIPT_START_TIME.toLocaleString()}`);
    console.log(`   Solo se procesarán correos posteriores a esta hora.`);
    console.log(`   Solo se notificará de: ${ALLOWED_SENDER}`);
    console.log('----------------------------------------------------------------');
    
    console.log(`Iniciando monitoreo de correo cada ${MONITORING_INTERVAL / 1000} segundos.`);
    checkNewEmails();
    setInterval(checkNewEmails, MONITORING_INTERVAL);
});

client.on('auth_failure', (msg) => console.error('❌ Fallo en la autenticación de WhatsApp:', msg));
client.on('disconnected', (reason) => console.warn('Cliente de WhatsApp desconectado:', reason));

client.initialize();

/**
 * REESCRITO: Usa una barrera de tiempo y marca los correos como leídos.
 * Busca correos no leídos y los filtra por fecha y remitente.
 */
async function checkNewEmails() {
    let connection;
    try {
        connection = await imaps.connect(imapConfig);
        await connection.openBox('INBOX');

        // Busca todos los correos NO LEÍDOS
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'] ,
            markSeen: false // No marcar como leído automáticamente al buscar
        };
        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            // Silencio absoluto si no hay nada nuevo
            await connection.end();
            return;
        }

        for (const message of messages) {
            const attributes = message.attributes;
            const header = _.get(message, 'parts[0].body', null);
            if (!header || !header.from || !header.subject || !attributes.date) {
                continue;
            }
            
            const emailDate = new Date(attributes.date);
            
            // --- FILTRO DOBLE Y ESTRICTO ---

            // 1. Condición de Fecha: Ignora todo lo que sea anterior o igual a la hora de inicio.
            if (emailDate <= SCRIPT_START_TIME) {
                continue; // Silencio absoluto
            }

            const from = header.from[0];
            // 2. Condición de Remitente
            if (!from.includes(ALLOWED_SENDER)) {
                continue; // Silencio absoluto
            }

            // --- ACCIÓN: Solo se ejecuta si pasa ambos filtros ---
            const subject = header.subject[0];
            const horaCorreo = emailDate.toLocaleTimeString();

            console.log(`✅ Nuevo BCP detectado [Hora: ${horaCorreo}] Enviando alerta...`);
            
            const messageBody = `🔔 *Nueva Transacción Detectada*\n\n*Asunto:* ${subject}`;
            const chatId = `${WHATSAPP_NUMBER}@c.us`;

            try {
                await client.sendMessage(chatId, messageBody);

                // MUY IMPORTANTE: Marcar como leído para no volver a notificar
                await connection.addFlags(attributes.uid, ['\Seen']);

            } catch (whatsappError) {
                console.error('  ❌ Error al enviar el mensaje de WhatsApp:', whatsappError);
            }
        }
        
        await connection.end();

    } catch (error) {
        if (!error.message.includes('Nothing to fetch')) {
           console.error('❌ Error durante el ciclo de monitoreo:', error.message);
        }
        if (connection) await connection.end();
    }
}