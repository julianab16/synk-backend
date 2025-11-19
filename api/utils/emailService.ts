import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;

// Logger simple (reemplaza con tu logger real si tienes uno)
const logger = {
  error: (tag: string, msg: string) => console.error(`[${tag}]`, msg),
  success: (tag: string, msg: string) => console.log(`[${tag}]`, msg),
  info: (tag: string, msg: string) => console.log(`[${tag}]`, msg),
};

if (!SENDGRID_API_KEY) {
  logger.error("EMAIL", "❌ SENDGRID_API_KEY no configurada");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.success("EMAIL", "✅ SendGrid configurado correctamente");
}

/**
 * Enviar email de recuperación de contraseña usando SendGrid
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  userName: string
) => {
  try {
    // Validación
    if (!to || !resetToken || !userName) {
      throw new Error("Missing required parameters");
    }

    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    // Asegurarnos de que FROM_EMAIL esté configurado (narrowing para TypeScript)
    if (!FROM_EMAIL) {
      throw new Error("EMAIL_FROM or EMAIL_USER not configured");
    }

    // Construir URL de reset
    const frontendBase = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    const resetUrlString = `${frontendBase}/reset-password?token=${resetToken}`;

    // ✅ Configurar mensaje para SendGrid
    const msg = {
      to: to,
      from: {
        email: FROM_EMAIL,
        name: 'Synk Meet'
      },
      subject: '🔐 Recuperación de Contraseña - SamFilms',
      text: `Hola ${userName},\n\nPara restablecer tu contraseña, visita el siguiente enlace:\n${resetUrlString}\n\n⚠️ Este enlace expirará en 1 hora y solo puede usarse una vez.\n\nSi no solicitaste este cambio, ignora este correo.\n\n---\nSamFilms - ${new Date().getFullYear()}\nEste es un correo automático, por favor no respondas.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background-color: #667eea; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold; 
              margin: 20px 0; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              color: #666; 
              font-size: 14px; 
            }
            .warning { 
              background: #fff3cd; 
              border-left: 4px solid #ffc107; 
              padding: 15px; 
              margin: 20px 0; 
            }
            .code-box {
              background: #fff;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 5px;
              font-size: 12px;
              word-break: break-all;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎬 SamFilms</h1>
              <p style="margin: 10px 0 0 0;">Recuperación de Contraseña</p>
            </div>
            <div class="content">
              <h2 style="color: #333;">Hola ${userName},</h2>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SamFilms.</p>
              <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrlString}" class="button">
                  Restablecer Contraseña
                </a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Este enlace expirará en <strong>1 hora</strong></li>
                  <li>Solo puedes usarlo <strong>una vez</strong></li>
                  <li>Si no solicitaste este cambio, ignora este correo</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <div class="code-box">
                ${resetUrlString}
              </div>
            </div>
            <div class="footer">
              <p style="margin: 5px 0;">Este es un correo automático, por favor no respondas.</p>
              <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} SamFilms. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    logger.success("EMAIL", `✅ Email enviado a ${to}`);
  } catch (error) {
    logger.error("EMAIL", `❌ Error al enviar email: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Función para probar la configuración de SendGrid
 */
export const testEmailConfiguration = async () => {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY not configured");
    }
    logger.info("EMAIL", "✅ SendGrid API Key configurada correctamente");
    return true;
  } catch (error) {
    logger.error("EMAIL", `❌ ${(error as Error).message}`);
    return false;
  }
};

export default {
  sendPasswordResetEmail,
  testEmailConfiguration,
};
