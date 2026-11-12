import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false };

export const limiteGlobal = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
});

export const limiteAuth = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: 'Demasiados intentos, intenta en unos minutos' },
});

// El asistente IA consume cuota de pago: limitar por usuario
export const limiteIA = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `ia-${req.user.id}`, // la ruta ya pasó por authenticate
  message: { error: 'Has hecho demasiadas consultas al asistente, espera un minuto' },
});

// Correos salientes: evita que una cuenta comprometida se use para enviar spam
export const limiteCorreo = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => `correo-${req.user.id}`,
  message: { error: 'Has enviado demasiados correos en la última hora' },
});
