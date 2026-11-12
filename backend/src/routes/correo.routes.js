import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { limiteCorreo } from '../middlewares/rateLimit.js';
import { enviarCorreoSchema } from '../schemas/correo.schemas.js';
import { enviar } from '../controllers/correo.controller.js';

const r = Router();
r.post('/', authenticate, authorize('tecnico', 'admin'), limiteCorreo, validate(enviarCorreoSchema), h(enviar));
export default r;
