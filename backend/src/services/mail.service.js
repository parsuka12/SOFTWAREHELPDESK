import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

export async function enviarCorreo({ para, asunto, texto }) {
  if (!transporter) {
    console.log(`[correo simulado] Para: ${para} | Asunto: ${asunto}\n${texto}\n`);
    return { simulado: true };
  }
  await transporter.sendMail({ from: env.MAIL_FROM, to: para, subject: asunto, text: texto });
  return { simulado: false };
}
