import { query } from '../config/db.js';
import { enviarCorreo } from './mail.service.js';

// Crea notificaciones dentro de la app y envía el correo correspondiente.
// Nunca lanza errores: una notificación fallida no debe romper la operación principal.
export async function notificar({ usuarios, excluir, ticket, tipo, mensaje }) {
  try {
    const ids = [...new Set(usuarios)].filter((id) => id && id !== excluir);
    if (!ids.length) return;

    await query(
      `INSERT INTO notifications (user_id, ticket_id, tipo, mensaje)
       SELECT unnest($1::int[]), $2, $3, $4`,
      [ids, ticket.id, tipo, mensaje],
    );

    const { rows } = await query('SELECT email FROM users WHERE id = ANY($1::int[]) AND active = true', [ids]);
    for (const { email } of rows) {
      enviarCorreo({
        para: email,
        asunto: `[Mesa de Ayuda] Ticket #${ticket.id}: ${ticket.nombre}`,
        texto: mensaje,
      }).catch((e) => console.error('Error enviando correo:', e.message));
    }
  } catch (err) {
    console.error('Error creando notificaciones:', err.message);
  }
}

export async function idsStaff() {
  const { rows } = await query("SELECT id FROM users WHERE role IN ('tecnico','admin') AND active = true");
  return rows.map((r) => r.id);
}

// Creador, técnico asignado y quienes observan el ticket
export async function idsInteresados(ticketId) {
  const { rows } = await query(
    `SELECT creado_por AS id FROM tickets WHERE id = $1
     UNION SELECT asignado_a FROM tickets WHERE id = $1 AND asignado_a IS NOT NULL
     UNION SELECT user_id FROM ticket_watchers WHERE ticket_id = $1`,
    [ticketId],
  );
  return rows.map((r) => r.id);
}
