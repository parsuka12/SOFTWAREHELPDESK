import { z } from 'zod';
import { VISTAS } from '../services/ticket.service.js';

export const NIVELES = ['bajo', 'medio', 'alto'];
export const ESTADOS = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];

const texto = (min, max) => z.string().trim().min(min).max(max);
const opcional = (max) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

export const crearTicketSchema = z.object({
  nombre: texto(3, 200),
  descripcion: texto(5, 5000),
  nivel: z.enum(NIVELES),
  equipo: opcional(120),
  cuenta: opcional(120),
});

export const actualizarTicketSchema = z
  .object({
    nombre: texto(3, 200),
    descripcion: texto(5, 5000),
    nivel: z.enum(NIVELES),
    estado: z.enum(ESTADOS),
    equipo: opcional(120),
    cuenta: opcional(120),
    asignado_a: z.number().int().positive().nullable(),
    solucion: texto(3, 5000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada que actualizar' });

export const resolverSchema = z.object({ solucion: texto(3, 5000) });
export const comentarioSchema = z.object({ mensaje: texto(1, 3000) });

// "a,b,c" -> ['a','b','c'] validado contra un enum
const lista = (enumeracion) =>
  z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.enum(enumeracion)))
    .optional();

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: AAAA-MM-DD').optional();

export const listarTicketsSchema = z.object({
  vista: z.enum(VISTAS).default('todos'),
  estado: lista(ESTADOS),
  nivel: lista(NIVELES),
  equipo: z.string().trim().max(120).optional(),
  cuenta: z.string().trim().max(120).optional(),
  asignado_a: z.string().regex(/^(\d+|sin_asignar)$/).optional(),
  creado_por: z.coerce.number().int().positive().optional(),
  vencidos: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  desde: fecha,
  hasta: fecha,
  q: z.string().trim().max(200).optional(),
  orden: z.enum(['recientes', 'antiguos', 'vencimiento', 'prioridad']).default('recientes'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
