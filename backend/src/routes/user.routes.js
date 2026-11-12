import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { actualizarUsuarioSchema, crearUsuarioSchema } from '../schemas/auth.schemas.js';
import * as c from '../controllers/user.controller.js';

const r = Router();
r.use(authenticate);
r.get('/tecnicos', authorize('tecnico', 'admin'), h(c.listarTecnicos));
r.get('/', authorize('admin'), h(c.listarUsuarios));
r.post('/', authorize('admin'), validate(crearUsuarioSchema), h(c.crearUsuario));
r.patch('/:id(\\d+)', authorize('admin'), validate(actualizarUsuarioSchema), h(c.actualizarUsuario));
export default r;
