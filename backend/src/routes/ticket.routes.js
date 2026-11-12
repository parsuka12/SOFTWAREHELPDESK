import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { limiteIA } from '../middlewares/rateLimit.js';
import {
  actualizarTicketSchema, comentarioSchema, crearTicketSchema, listarTicketsSchema, resolverSchema,
} from '../schemas/ticket.schemas.js';
import * as t from '../controllers/ticket.controller.js';
import * as ia from '../controllers/ia.controller.js';

const r = Router();
const staff = authorize('tecnico', 'admin');
r.use(authenticate);

// Listado, vistas y creación
r.get('/', validate(listarTicketsSchema, 'query'), h(t.listar));
r.get('/vistas/conteos', h(t.conteos));
r.post('/', validate(crearTicketSchema), h(t.crear));

// Detalle y edición
r.get('/:id(\\d+)', h(t.detalle));
r.patch('/:id(\\d+)', validate(actualizarTicketSchema), h(t.actualizar));
r.post('/:id(\\d+)/resolver', staff, validate(resolverSchema), h(t.resolver));

// Estrella (tickets que estoy observando)
r.post('/:id(\\d+)/observar', h(t.observar));
r.delete('/:id(\\d+)/observar', h(t.dejarDeObservar));

// Archivar y papelera
r.post('/:id(\\d+)/archivar', staff, h(t.archivar));
r.post('/:id(\\d+)/desarchivar', staff, h(t.desarchivar));
r.delete('/:id(\\d+)', staff, h(t.enviarAPapelera));
r.post('/:id(\\d+)/restaurar', staff, h(t.restaurar));
r.delete('/:id(\\d+)/permanente', authorize('admin'), h(t.eliminarDefinitivo));

// Comentarios
r.get('/:id(\\d+)/comentarios', h(t.listarComentarios));
r.post('/:id(\\d+)/comentarios', validate(comentarioSchema), h(t.comentar));

// Asistente IA (solo técnicos/admin, a solicitud)
r.get('/:id(\\d+)/sugerencias-ia', staff, h(ia.historial));
r.post('/:id(\\d+)/sugerencias-ia', staff, limiteIA, h(ia.sugerir));

export default r;
