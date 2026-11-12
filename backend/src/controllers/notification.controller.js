import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export async function listar(req, res) {
  const soloNoLeidas = req.query.solo_no_leidas === 'true';
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const { rows } = await query(
    `SELECT id, ticket_id, tipo, mensaje, leida, created_at FROM notifications
     WHERE user_id = $1 ${soloNoLeidas ? 'AND leida = false' : ''}
     ORDER BY created_at DESC LIMIT $2`,
    [req.user.id, limit],
  );
  res.json({ data: rows });
}

// Número rojo de la campana
export async function conteo(req, res) {
  const { rows } = await query('SELECT COUNT(*)::int AS no_leidas FROM notifications WHERE user_id = $1 AND leida = false', [req.user.id]);
  res.json(rows[0]);
}

export async function marcarLeida(req, res) {
  const { rowCount } = await query('UPDATE notifications SET leida = true WHERE id = $1 AND user_id = $2', [Number(req.params.id), req.user.id]);
  if (!rowCount) throw new HttpError(404, 'Notificación no encontrada');
  res.json({ ok: true });
}

export async function marcarTodasLeidas(req, res) {
  await query('UPDATE notifications SET leida = true WHERE user_id = $1 AND leida = false', [req.user.id]);
  res.json({ ok: true });
}
