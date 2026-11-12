import { Router } from 'express';
import auth from './auth.routes.js';
import usuarios from './user.routes.js';
import tickets from './ticket.routes.js';
import dashboard from './dashboard.routes.js';
import notificaciones from './notification.routes.js';
import correos from './correo.routes.js';

const r = Router();
r.get('/health', (_req, res) => res.json({ ok: true, hora: new Date().toISOString() }));
r.use('/auth', auth);
r.use('/usuarios', usuarios);
r.use('/tickets', tickets);
r.use('/dashboard', dashboard);
r.use('/notificaciones', notificaciones);
r.use('/correos', correos);
export default r;
