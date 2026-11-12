import 'dotenv/config';

const requerida = (k) => {
  if (!process.env[k]) throw new Error(`Falta la variable de entorno ${k}`);
  return process.env[k];
};
const numero = (k, defecto) => {
  const raw = process.env[k];
  if (raw === undefined || raw === '') return defecto;
  const n = Number(raw);
  return Number.isFinite(n) ? n : defecto;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: numero('PORT', 4000),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),

  DATABASE_URL: requerida('DATABASE_URL'),
  DB_SSL: process.env.DB_SSL === 'true',

  JWT_SECRET: requerida('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  // Horas (enteras) para responder/resolver según el nivel del ticket
  SLA: {
    alto: Math.round(numero('SLA_HORAS_ALTO', 3)),
    medio: Math.round(numero('SLA_HORAS_MEDIO', 8)),
    bajo: Math.round(numero('SLA_HORAS_BAJO', 16)),
  },

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: numero('SMTP_PORT', 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Mesa de Ayuda <no-reply@localhost>',

  SEED_PASSWORD: process.env.SEED_PASSWORD || 'Cambiar123!',
};
