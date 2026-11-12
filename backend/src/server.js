import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { iniciarJobSla } from './services/sla.job.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API de Mesa de Ayuda en http://localhost:${env.PORT}/api`);
  if (!env.GEMINI_API_KEY) console.warn('⚠️  GEMINI_API_KEY no configurada: el asistente de IA estará deshabilitado');
});

const jobSla = iniciarJobSla();

const apagar = async (senal) => {
  console.log(`\n${senal} recibido, cerrando...`);
  clearInterval(jobSla);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
