import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { metricas } from '../controllers/dashboard.controller.js';

const r = Router();
r.get('/metricas', authenticate, authorize('tecnico', 'admin'), h(metricas));
export default r;
