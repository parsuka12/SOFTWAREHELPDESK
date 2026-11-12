import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) throw new HttpError(401, 'Token requerido');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Token inválido o expirado');
  }

  const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1 AND active = true', [payload.sub]);
  if (!rows[0]) throw new HttpError(401, 'Usuario no válido');
  req.user = rows[0];
  next();
});

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'No tienes permisos para esta acción'));
    next();
  };
