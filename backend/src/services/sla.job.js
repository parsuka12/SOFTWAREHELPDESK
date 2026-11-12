import { query } from '../config/db.js';
import { notificar, idsStaff } from './notification.service.js';

const CADA_MS = 10 * 60 * 1000;

// Avisa una sola vez cuando un ticket está por vencer (<1h) o ya venció
export async function revisarSla() {
  try {
    const { rows } = await query(
      `SELECT id, nombre, asignado_a, fecha_limite
       FROM tickets
       WHERE estado IN ('abierto','en_proceso') AND eliminado_en IS NULL
         AND alerta_sla_enviada = false AND fecha_limite <= now() + interval '1 hour'`,
    );

    const staff = rows.some((t) => !t.asignado_a) ? await idsStaff() : [];
    for (const t of rows) {
      const vencido = new Date(t.fecha_limite) < new Date();
      await notificar({
        usuarios: t.asignado_a ? [t.asignado_a] : staff,
        ticket: t,
        tipo: 'sla',
        mensaje: vencido
          ? `El ticket #${t.id} "${t.nombre}" superó su tiempo de respuesta.`
          : `El ticket #${t.id} "${t.nombre}" vence en menos de 1 hora.`,
      });
      await query('UPDATE tickets SET alerta_sla_enviada = true WHERE id = $1', [t.id]);
    }
  } catch (err) {
    console.error('Error revisando SLA:', err.message);
  }
}

export function iniciarJobSla() {
  const timer = setInterval(revisarSla, CADA_MS);
  timer.unref();
  revisarSla();
  return timer;
}
