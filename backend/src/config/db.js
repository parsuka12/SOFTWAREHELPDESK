import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 10,
});

pool.on('error', (err) => console.error('Error inesperado en el pool de PostgreSQL:', err));

export const query = (texto, params) => pool.query(texto, params);
