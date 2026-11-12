import { obtenerTicket } from '../services/ticket.service.js';
import { generarSugerencias, listarSugerencias } from '../services/ai/asistente.service.js';

// El técnico pide las sugerencias manualmente (no se generan solas)
export async function sugerir(req, res) {
  const ticket = await obtenerTicket(Number(req.params.id), req.user, { incluirEliminados: false });
  res.status(201).json({ sugerencia: await generarSugerencias(ticket, req.user) });
}

export async function historial(req, res) {
  const ticket = await obtenerTicket(Number(req.params.id), req.user);
  res.json({ data: await listarSugerencias(ticket.id) });
}
