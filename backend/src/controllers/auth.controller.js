import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const firmar = (user) => jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
const publico = ({ id, name, email, role }) => ({ id, name, email, role });

// Registro público: siempre crea usuarios con rol "usuario".
// Los roles tecnico/admin los asigna un administrador.
export async function registrar(req, res) {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'usuario')
     RETURNING id, name, email, role`,
    [name, email, hash],
  );
  res.status(201).json({ token: firmar(rows[0]), user: publico(rows[0]) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = $1 AND active = true', [email]);
  const user = rows[0];
  // Mismo mensaje para usuario inexistente o contraseña incorrecta
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, 'Credenciales incorrectas');
  }
  res.json({ token: firmar(user), user: publico(user) });
}

export const perfil = (req, res) => res.json({ user: req.user });
