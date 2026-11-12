import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { limiteAuth } from '../middlewares/rateLimit.js';
import { loginSchema, registroSchema } from '../schemas/auth.schemas.js';
import * as c from '../controllers/auth.controller.js';

const r = Router();
r.post('/registro', limiteAuth, validate(registroSchema), h(c.registrar));
r.post('/login', limiteAuth, validate(loginSchema), h(c.login));
r.get('/me', authenticate, c.perfil);
export default r;
