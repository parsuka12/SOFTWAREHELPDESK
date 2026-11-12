import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { colorPorNivel, hexPorNivel } from '../utils/sla.js';

export const VISTAS = [
  'nuevo_y_mis_abiertos',
  'observando',
  'creados',
  'todos',
  'sin_resolver',
  'archivados',
  'papelera',
];

const BASE_SELECT = `
  SELECT t.*,
         uc.name AS creado_por_nombre,
         ua.name AS asignado_a_nombre,
         EXISTS (SELECT 1 FROM ticket_watchers w WHERE w.ticket_id = t.id AND w.user_id = $1) AS observando
  FROM tickets t
  JOIN users uc ON uc.id = t.creado_por
  LEFT JOIN users ua ON ua.id = t.asignado_a`;

const ORDENES = {
  recientes: 't.id DESC',
  antiguos: 't.id ASC',
  vencimiento: 't.fecha_limite ASC',
  prioridad: "CASE t.nivel WHEN 'alto' THEN 1 WHEN 'medio' THEN 2 ELSE 3 END, t.fecha_limite ASC",
};

export function formatearTicket(r) {
  const sinResolver = ['abierto', 'en_proceso'].includes(r.estado);
  return {
    ...r,
    numero: r.id,
    color: colorPorNivel(r.nivel),
    color_hex: hexPorNivel(r.nivel),
    tiempo_respuesta: `${r.tiempo_respuesta_horas}h`,
    vencido: sinResolver && new Date(r.fecha_limite) < new Date(),
  };
}

const escaparLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// Construye el WHERE según el rol del usuario, la vista seleccionada y los filtros
function construirWhere(user, vista, f = {}) {
  const params = [user.id];
  const where = [];
  const add = (valor) => {
    params.push(valor);
    return `$${params.length}`;
  };

  // Un usuario "normal" solo ve sus propios tickets
  if (user.role === 'usuario') where.push('t.creado_por = $1');

  if (vista === 'papelera') {
    where.push('t.eliminado_en IS NOT NULL');
  } else {
    where.push('t.eliminado_en IS NULL');
    where.push(vista === 'archivados' ? 't.archivado = true' : 't.archivado = false');
  }

  switch (vista) {
    case 'nuevo_y_mis_abiertos':
      where.push(`(t.estado IN ('abierto','en_proceso') AND (t.asignado_a IS NULL OR t.asignado_a = $1 OR t.creado_por = $1))`);
      break;
    case 'observando':
      where.push('EXISTS (SELECT 1 FROM ticket_watchers w WHERE w.ticket_id = t.id AND w.user_id = $1)');
      break;
    case 'creados':
      where.push('t.creado_por = $1');
      break;
    case 'sin_resolver':
      where.push(`t.estado IN ('abierto','en_proceso')`);
      break;
    default:
      break; // todos, archivados, papelera
  }

  if (f.estado?.length) where.push(`t.estado = ANY(${add(f.estado)})`);
  if (f.nivel?.length) where.push(`t.nivel = ANY(${add(f.nivel)})`);
  if (f.equipo) where.push(`t.equipo ILIKE ${add(`%${escaparLike(f.equipo)}%`)}`);
  if (f.cuenta) where.push(`t.cuenta ILIKE ${add(`%${escaparLike(f.cuenta)}%`)}`);
  if (f.creado_por) where.push(`t.creado_por = ${add(f.creado_por)}`);
  if (f.asignado_a === 'sin_asignar') where.push('t.asignado_a IS NULL');
  else if (f.asignado_a) where.push(`t.asignado_a = ${add(Number(f.asignado_a))}`);
  if (f.vencidos) where.push(`(t.estado IN ('abierto','en_proceso') AND t.fecha_limite < now())`);
  if (f.desde) where.push(`t.created_at >= ${add(f.desde)}::date`);
  if (f.hasta) where.push(`t.created_at < (${add(f.hasta)}::date + 1)`);
  if (f.q) {
    const like = add(`%${escaparLike(f.q)}%`);
    const numero = /^#?\d+$/.test(f.q.trim()) ? ` OR t.id = ${add(Number(f.q.trim().replace('#', '')))}` : '';
    where.push(`(t.nombre ILIKE ${like} OR t.descripcion ILIKE ${like}${numero})`);
  }

  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export async function listarTickets(user, filtros) {
  const { vista = 'todos', orden = 'recientes', page = 1, limit = 20, ...resto } = filtros;
  const { where, params } = construirWhere(user, vista, resto);

  const [lista, total] = await Promise.all([
    query(
      `${BASE_SELECT} ${where} ORDER BY ${ORDENES[orden] ?? ORDENES.recientes}
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params,
    ),
    query(`SELECT COUNT(*)::int AS n FROM tickets t ${where}`, params),
  ]);

  return {
    data: lista.rows.map(formatearTicket),
    total: total.rows[0].n,
    page,
    limit,
    vista,
  };
}

// Contadores de cada vista del panel izquierdo (y el número del encabezado)
export async function conteosVistas(user) {
  const entradas = await Promise.all(
    VISTAS.map(async (vista) => {
      const { where, params } = construirWhere(user, vista);
      const { rows } = await query(`SELECT COUNT(*)::int AS n FROM tickets t ${where}`, params);
      return [vista, rows[0].n];
    }),
  );
  return Object.fromEntries(entradas);
}

// Obtiene un ticket respetando permisos (los usuarios solo ven los suyos)
export async function obtenerTicket(id, user, { incluirEliminados = true } = {}) {
  const { rows } = await query(`${BASE_SELECT} WHERE t.id = $2`, [user.id, id]);
  const ticket = rows[0];
  if (!ticket || (!incluirEliminados && ticket.eliminado_en)) throw new HttpError(404, 'Ticket no encontrado');
  if (user.role === 'usuario' && ticket.creado_por !== user.id) throw new HttpError(404, 'Ticket no encontrado');
  return formatearTicket(ticket);
}
