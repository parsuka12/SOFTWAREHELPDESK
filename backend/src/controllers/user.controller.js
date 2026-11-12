import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export async function listarUsuarios(_req, res) {
  const { rows } = await query('SELECT id, name, email, role, active, created_at FROM users ORDER BY id');
  res.json({ data: rows });
}

// Técnicos y administradores: para asignar tickets
export async function listarTecnicos(_req, res) {
  const { rows } = await query(
    "SELECT id, name, email, role FROM users WHERE role IN ('tecnico','admin') AND active = true ORDER BY name",
  );
  res.json({ data: rows });
}

export async function crearUsuario(req, res) {
  const { name, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role, active, created_at`,
    [name, email, hash, role],
  );
  res.status(201).json({ user: rows[0] });
}

export async function actualizarUsuario(req, res) {
  const id = Number(req.params.id);
  const { role, active } = req.body;

  // Evita que el único admin se quite sus propios permisos por accidente
  if (id === req.user.id && (role && role !== 'admin' || active === false)) {
    throw new HttpError(400, 'No puedes quitarte el rol de administrador ni desactivarte a ti mismo');
  }

  const { rows } = await query(
    `UPDATE users SET role = COALESCE($1, role), active = COALESCE($2, active)
     WHERE id = $3 RETURNING id, name, email, role, active`,
    [role ?? null, active ?? null, id],
  );
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado');
  res.json({ user: rows[0] });
}
