import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { horasPorNivel, calcularFechaLimite } from '../utils/sla.js';
import { conteosVistas, listarTickets, obtenerTicket } from '../services/ticket.service.js';
import { idsInteresados, idsStaff, notificar } from '../services/notification.service.js';

const esStaff = (u) => u.role === 'tecnico' || u.role === 'admin';
const id = (req) => Number(req.params.id);

// ---------- Lectura ----------
export async function listar(req, res) {
  res.json(await listarTickets(req.user, req.query));
}

export async function conteos(req, res) {
  res.json({ data: await conteosVistas(req.user) });
}

export async function detalle(req, res) {
  res.json({ ticket: await obtenerTicket(id(req), req.user) });
}

// ---------- Crear ----------
export async function crear(req, res) {
  const { nombre, descripcion, nivel, equipo, cuenta } = req.body;
  const ahora = new Date();
  const { rows } = await query(
    `INSERT INTO tickets (nombre, descripcion, nivel, equipo, cuenta, creado_por,
                          tiempo_respuesta_horas, fecha_limite, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING id`,
    [nombre, descripcion, nivel, equipo, cuenta, req.user.id, horasPorNivel(nivel), calcularFechaLimite(ahora, nivel), ahora],
  );

  const ticket = await obtenerTicket(rows[0].id, req.user);
  await notificar({
    usuarios: await idsStaff(),
    excluir: req.user.id,
    ticket,
    tipo: 'ticket_nuevo',
    mensaje: `${req.user.name} creó el ticket #${ticket.id} "${ticket.nombre}" (nivel ${ticket.nivel}, ${ticket.tiempo_respuesta} para responder).`,
  });
  res.status(201).json({ ticket });
}

// ---------- Actualizar ----------
export async function actualizar(req, res) {
  const actual = await obtenerTicket(id(req), req.user, { incluirEliminados: false });
  const cambios = req.body;
  const staff = esStaff(req.user);

  // Un usuario normal solo edita el contenido de sus tickets mientras estén abiertos
  if (!staff) {
    const permitidos = ['nombre', 'descripcion', 'equipo', 'cuenta'];
    if (Object.keys(cambios).some((k) => !permitidos.includes(k))) {
      throw new HttpError(403, 'No tienes permisos para modificar esos campos');
    }
    if (actual.estado !== 'abierto') throw new HttpError(409, 'Solo puedes editar tickets que sigan abiertos');
  }

  if (cambios.asignado_a) {
    const { rows } = await query(
      "SELECT 1 FROM users WHERE id = $1 AND role IN ('tecnico','admin') AND active = true",
      [cambios.asignado_a],
    );
    if (!rows[0]) throw new HttpError(400, 'El usuario asignado debe ser un técnico o administrador activo');
  }

  const sets = [];
  const valores = [];
  const set = (col, v) => {
    valores.push(v);
    sets.push(`${col} = $${valores.length}`);
  };

  for (const k of ['nombre', 'descripcion', 'equipo', 'cuenta', 'asignado_a', 'solucion']) {
    if (k in cambios) set(k, cambios[k]);
  }

  // El tiempo de respuesta sigue al nivel y se recalcula desde la creación del ticket
  if (cambios.nivel && cambios.nivel !== actual.nivel) {
    set('nivel', cambios.nivel);
    set('tiempo_respuesta_horas', horasPorNivel(cambios.nivel));
    set('fecha_limite', calcularFechaLimite(actual.created_at, cambios.nivel));
    set('alerta_sla_enviada', false);
  }

  if (cambios.estado && cambios.estado !== actual.estado) {
    set('estado', cambios.estado);
    if (['resuelto', 'cerrado'].includes(cambios.estado)) {
      if (!actual.resuelto_en) set('resuelto_en', new Date());
    } else {
      set('resuelto_en', null);
    }
  }

  if (!sets.length) return res.json({ ticket: actual });

  valores.push(actual.id);
  await query(`UPDATE tickets SET ${sets.join(', ')}, updated_at = now() WHERE id = $${valores.length}`, valores);
  const ticket = await obtenerTicket(actual.id, req.user);

  // Notificaciones
  const interesados = await idsInteresados(ticket.id);
  if (cambios.asignado_a && cambios.asignado_a !== actual.asignado_a) {
    await notificar({
      usuarios: [cambios.asignado_a], excluir: req.user.id, ticket, tipo: 'asignado',
      mensaje: `Se te asignó el ticket #${ticket.id} "${ticket.nombre}". Tienes ${ticket.tiempo_respuesta} para responder.`,
    });
  }
  if (ticket.estado !== actual.estado) {
    await notificar({
      usuarios: interesados, excluir: req.user.id, ticket, tipo: 'estado',
      mensaje: `El ticket #${ticket.id} "${ticket.nombre}" cambió a "${ticket.estado.replace('_', ' ')}".`,
    });
  }
  if (ticket.nivel !== actual.nivel) {
    await notificar({
      usuarios: interesados, excluir: req.user.id, ticket, tipo: 'nivel',
      mensaje: `El ticket #${ticket.id} cambió a nivel ${ticket.nivel} (${ticket.tiempo_respuesta} de tiempo de respuesta).`,
    });
  }

  res.json({ ticket });
}

export async function resolver(req, res) {
  const actual = await obtenerTicket(id(req), req.user, { incluirEliminados: false });
  await query(
    `UPDATE tickets SET estado = 'resuelto', solucion = $1, resuelto_en = now(),
            asignado_a = COALESCE(asignado_a, $2), updated_at = now() WHERE id = $3`,
    [req.body.solucion, req.user.id, actual.id],
  );
  const ticket = await obtenerTicket(actual.id, req.user);
  await notificar({
    usuarios: await idsInteresados(ticket.id), excluir: req.user.id, ticket, tipo: 'estado',
    mensaje: `El ticket #${ticket.id} "${ticket.nombre}" fue resuelto.`,
  });
  res.json({ ticket });
}

// ---------- Estrella / observando ----------
export async function observar(req, res) {
  const ticket = await obtenerTicket(id(req), req.user, { incluirEliminados: false });
  await query('INSERT INTO ticket_watchers (ticket_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [ticket.id, req.user.id]);
  res.json({ observando: true });
}

export async function dejarDeObservar(req, res) {
  const ticket = await obtenerTicket(id(req), req.user);
  await query('DELETE FROM ticket_watchers WHERE ticket_id = $1 AND user_id = $2', [ticket.id, req.user.id]);
  res.json({ observando: false });
}

// ---------- Archivar / papelera ----------
const cambiarFlag = (sql) => async (req, res) => {
  const ticket = await obtenerTicket(id(req), req.user);
  await query(sql, [ticket.id]);
  res.json({ ticket: await obtenerTicket(ticket.id, req.user) });
};
export const archivar = cambiarFlag('UPDATE tickets SET archivado = true, updated_at = now() WHERE id = $1');
export const desarchivar = cambiarFlag('UPDATE tickets SET archivado = false, updated_at = now() WHERE id = $1');
export const enviarAPapelera = cambiarFlag('UPDATE tickets SET eliminado_en = now(), updated_at = now() WHERE id = $1');
export const restaurar = cambiarFlag('UPDATE tickets SET eliminado_en = NULL, updated_at = now() WHERE id = $1');

export async function eliminarDefinitivo(req, res) {
  const ticket = await obtenerTicket(id(req), req.user);
  if (!ticket.eliminado_en) throw new HttpError(409, 'Primero envía el ticket a la papelera');
  await query('DELETE FROM tickets WHERE id = $1', [ticket.id]);
  res.status(204).end();
}

// ---------- Comentarios ----------
export async function listarComentarios(req, res) {
  const ticket = await obtenerTicket(id(req), req.user);
  const { rows } = await query(
    `SELECT c.id, c.mensaje, c.created_at, u.id AS user_id, u.name AS autor, u.role
     FROM ticket_comments c JOIN users u ON u.id = c.user_id
     WHERE c.ticket_id = $1 ORDER BY c.created_at ASC`,
    [ticket.id],
  );
  res.json({ data: rows });
}

export async function comentar(req, res) {
  const ticket = await obtenerTicket(id(req), req.user, { incluirEliminados: false });
  const { rows } = await query(
    'INSERT INTO ticket_comments (ticket_id, user_id, mensaje) VALUES ($1,$2,$3) RETURNING id, mensaje, created_at',
    [ticket.id, req.user.id, req.body.mensaje],
  );
  await query('UPDATE tickets SET updated_at = now() WHERE id = $1', [ticket.id]);
  await notificar({
    usuarios: await idsInteresados(ticket.id), excluir: req.user.id, ticket, tipo: 'comentario',
    mensaje: `${req.user.name} comentó en el ticket #${ticket.id} "${ticket.nombre}".`,
  });
  res.status(201).json({ comentario: { ...rows[0], autor: req.user.name, user_id: req.user.id } });
}
