import { z } from 'zod';

export const enviarCorreoSchema = z.object({
  para: z.string().trim().toLowerCase().email('Correo de destino inválido').max(160),
  // Sin saltos de línea: evita inyección de cabeceras en el correo
  asunto: z.string().trim().min(1).max(200).regex(/^[^\r\n]+$/, 'El asunto no puede tener saltos de línea'),
  mensaje: z.string().trim().min(1).max(5000),
  ticket_id: z.number().int().positive().optional(),
});
