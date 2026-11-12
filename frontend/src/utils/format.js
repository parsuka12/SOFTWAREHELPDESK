// Niveles: colores del cuadrito según la captura de diseño
export const NIVELES = {
  alto: { label: 'Alta', color: '#ff4444', horas: 3 },
  medio: { label: 'Media', color: '#e8d000', horas: 8 },
  bajo: { label: 'Baja', color: '#22dd22', horas: 16 },
};
export const NIVEL_OPCIONES = Object.entries(NIVELES).map(([value, n]) => ({ value, label: n.label }));

export const ESTADOS = { abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' };
export const ESTADO_OPCIONES = [
  { value: 'sin_resolver', label: 'Todo lo que está sin resolver' },
  ...Object.entries(ESTADOS).map(([value, label]) => ({ value, label })),
];

export const ROLES = { admin: 'Administrador', tecnico: 'Técnico', usuario: 'Usuario' };

// Vistas del panel izquierdo (ids = parámetro `vista` del backend)
export const VISTAS = [
  { id: 'nuevo_y_mis_abiertos', label: 'Nuevo y mis tickets abiertos', icon: 'sparkles' },
  { id: 'observando', label: 'Tickets que estoy observando', icon: 'star' },
  { id: 'creados', label: 'Tickets que he creado', icon: 'megaphone' },
  { id: 'todos', label: 'Todos los tickets', icon: 'ticket' },
  { id: 'sin_resolver', label: 'Todos los tickets sin resolver', icon: 'ticket-x' },
  { id: 'archivados', label: 'Archivar', icon: 'archive', aparte: true },
  { id: 'papelera', label: 'Papelera', icon: 'trash', aparte: true },
];

const PALETA = ['#5aa332', '#2b1ba8', '#d92c2c', '#e8761c', '#1f6fa8', '#8a3fb5', '#0e8f8f', '#b5476b'];
export const inicial = (nombre) => (nombre || '?').trim().charAt(0).toUpperCase();
export function colorAvatar(nombre = '') {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}

export const fechaHora = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function tiempoRestante(limite, estado) {
  if (['resuelto', 'cerrado'].includes(estado)) return null;
  const ms = new Date(limite) - Date.now();
  const min = Math.floor(Math.abs(ms) / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const txt = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
  return { vencido: ms < 0, urgente: ms >= 0 && ms < 3600000, texto: ms < 0 ? `Vencido hace ${txt}` : `Vence en ${txt}` };
}
