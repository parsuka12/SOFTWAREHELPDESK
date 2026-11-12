import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { enviarCorreo } from '../services/mail.service.js';
import { obtenerTicket } from '../services/ticket.service.js';

// Botón "Nuevo > Nuevo correo": el técnico escribe a cualquier persona,
// opcionalmente referenciando un ticket (queda registrado como comentario).
export async function enviar(req, res) {
  const { para, asunto, mensaje, ticket_id } = req.body;
  const ticket = ticket_id ? await obtenerTicket(ticket_id, req.user, { incluirEliminados: false }) : null;

  const texto = `${mensaje}\n\n— ${req.user.name} (Mesa de Ayuda)${ticket ? `\nReferencia: ticket #${ticket.id} "${ticket.nombre}"` : ''}`;

  let resultado;
  try {
    resultado = await enviarCorreo({ para, asunto, texto });
  } catch (err) {
    console.error('Error enviando correo:', err.message);
    throw new HttpError(502, 'No se pudo enviar el correo. Revisa la configuración SMTP.');
  }

  if (ticket) {
    await query('INSERT INTO ticket_comments (ticket_id, user_id, mensaje) VALUES ($1,$2,$3)', [
      ticket.id,
      req.user.id,
      `Correo enviado a ${para} con el asunto "${asunto}".`,
    ]);
  }
  res.status(201).json({ ok: true, simulado: resultado.simulado });
}
