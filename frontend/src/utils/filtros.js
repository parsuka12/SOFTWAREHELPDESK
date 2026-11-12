// Estado inicial del panel de filtros según la vista
export const defaultFiltros = (vista) => ({
  activos: ['estado'],
  q: '',
  estado: vista === 'sin_resolver' ? ['sin_resolver'] : [],
  nivel: [],
  equipo: '',
  cuenta: '',
  asignado_a: '',
  desde: '',
  hasta: '',
  vencidos: false,
});

export const VACIO = { estado: [], nivel: [], equipo: '', cuenta: '', asignado_a: '', desde: '', hasta: '', vencidos: false };

// Convierte los filtros de la interfaz en parámetros para GET /tickets
export function aParams(f) {
  const p = {};
  const on = (k) => f.activos.includes(k);
  if (f.q.trim()) p.q = f.q.trim();
  if (on('estado') && f.estado.length) {
    p.estado = [...new Set(f.estado.flatMap((e) => (e === 'sin_resolver' ? ['abierto', 'en_proceso'] : [e])))];
  }
  if (on('nivel') && f.nivel.length) p.nivel = f.nivel;
  if (on('equipo') && f.equipo.trim()) p.equipo = f.equipo.trim();
  if (on('cuenta') && f.cuenta.trim()) p.cuenta = f.cuenta.trim();
  if (on('asignado_a') && f.asignado_a) p.asignado_a = f.asignado_a;
  if (on('fechas')) {
    if (f.desde) p.desde = f.desde;
    if (f.hasta) p.hasta = f.hasta;
  }
  if (on('vencidos') && f.vencidos) p.vencidos = 'true';
  return p;
}
