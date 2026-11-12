import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Correo inválido').max(160);
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100);

export const registroSchema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto').max(120),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Contraseña requerida'),
});

export const crearUsuarioSchema = registroSchema.extend({
  role: z.enum(['admin', 'tecnico', 'usuario']),
});

export const actualizarUsuarioSchema = z
  .object({
    role: z.enum(['admin', 'tecnico', 'usuario']).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.active !== undefined, { message: 'Nada que actualizar' });
