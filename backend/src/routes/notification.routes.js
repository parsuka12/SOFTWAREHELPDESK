import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { authenticate } from '../middlewares/auth.js';
import * as c from '../controllers/notification.controller.js';

const r = Router();
r.use(authenticate);
r.get('/', h(c.listar));
r.get('/conteo', h(c.conteo));
r.patch('/leer-todas', h(c.marcarTodasLeidas));
r.patch('/:id(\\d+)/leer', h(c.marcarLeida));
export default r;
