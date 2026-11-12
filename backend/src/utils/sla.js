import { env } from '../config/env.js';

// Nivel -> color del cuadrito en la interfaz y horas de SLA
export const NIVELES = {
  bajo: { color: 'verde', hex: '#22c55e' },
  medio: { color: 'amarillo', hex: '#eab308' },
  alto: { color: 'rojo', hex: '#ef4444' },
};

export const horasPorNivel = (nivel) => env.SLA[nivel];
export const colorPorNivel = (nivel) => NIVELES[nivel]?.color;
export const hexPorNivel = (nivel) => NIVELES[nivel]?.hex;

export const calcularFechaLimite = (desde, nivel) =>
  new Date(new Date(desde).getTime() + horasPorNivel(nivel) * 3600 * 1000);
