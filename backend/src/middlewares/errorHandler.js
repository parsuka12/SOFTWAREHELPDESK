import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export const notFound = (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === '23505') return res.status(409).json({ error: 'El registro ya existe' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
