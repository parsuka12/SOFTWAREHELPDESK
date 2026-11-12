import { query } from '../config/db.js';
import { NIVELES } from '../utils/sla.js';
import { horasPorNivel } from '../utils/sla.js';

export async function metricas(req, res) {
  const dias = Math.min(Math.max(Number(req.query.dias) || 30, 7), 180);

  const [totales, porNivel, serie, topEquipos, porTecnico] = await Promise.all([
    query(`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'abierto')::int    AS abiertos,
        COUNT(*) FILTER (WHERE estado = 'en_proceso')::int AS en_proceso,
        COUNT(*) FILTER (WHERE estado = 'resuelto')::int   AS resueltos,
        COUNT(*) FILTER (WHERE estado = 'cerrado')::int    AS cerrados,
        COUNT(*) FILTER (WHERE estado IN ('abierto','en_proceso') AND fecha_limite < now())::int AS vencidos,
        COUNT(*) FILTER (WHERE estado IN ('abierto','en_proceso') AND asignado_a IS NULL)::int   AS sin_asignar,
        ROUND((AVG(EXTRACT(EPOCH FROM (resuelto_en - created_at)) / 3600)
              FILTER (WHERE resuelto_en IS NOT NULL))::numeric, 1)::float8 AS tiempo_promedio_resolucion_horas,
        ROUND(100.0 * COUNT(*) FILTER (WHERE resuelto_en IS NOT NULL AND resuelto_en <= fecha_limite)
              / NULLIF(COUNT(*) FILTER (WHERE resuelto_en IS NOT NULL), 0), 1)::float8 AS cumplimiento_sla_pct
      FROM tickets WHERE eliminado_en IS NULL`),
    query(`
      SELECT nivel, COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE estado IN ('abierto','en_proceso'))::int AS sin_resolver
      FROM tickets WHERE eliminado_en IS NULL GROUP BY nivel`),
    query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS fecha,
         (SELECT COUNT(*)::int FROM tickets t WHERE t.eliminado_en IS NULL AND t.created_at::date = d::date)  AS creados,
         (SELECT COUNT(*)::int FROM tickets t WHERE t.eliminado_en IS NULL AND t.resuelto_en::date = d::date) AS resueltos
       FROM generate_series(current_date - ($1::int - 1), current_date, interval '1 day') AS d
       ORDER BY d`,
      [dias],
    ),
    query(`
      SELECT equipo, COUNT(*)::int AS total FROM tickets
      WHERE eliminado_en IS NULL AND equipo IS NOT NULL AND equipo <> ''
      GROUP BY equipo ORDER BY total DESC, equipo LIMIT 5`),
    query(`
      SELECT u.id, u.name,
        COUNT(t.id) FILTER (WHERE t.estado IN ('abierto','en_proceso'))::int AS en_curso,
        COUNT(t.id) FILTER (WHERE t.estado IN ('resuelto','cerrado'))::int   AS resueltos
      FROM users u LEFT JOIN tickets t ON t.asignado_a = u.id AND t.eliminado_en IS NULL
      WHERE u.role IN ('tecnico','admin') AND u.active = true
      GROUP BY u.id, u.name ORDER BY resueltos DESC, u.name`),
  ]);

  // Siempre devolver los 3 niveles (aunque no tengan tickets), con su color y SLA
  const nivelesMap = Object.fromEntries(porNivel.rows.map((r) => [r.nivel, r]));
  const por_nivel = ['alto', 'medio', 'bajo'].map((nivel) => ({
    nivel,
    color: NIVELES[nivel].color,
    color_hex: NIVELES[nivel].hex,
    tiempo_respuesta_horas: horasPorNivel(nivel),
    total: nivelesMap[nivel]?.total ?? 0,
    sin_resolver: nivelesMap[nivel]?.sin_resolver ?? 0,
  }));

  res.json({
    totales: totales.rows[0],
    por_nivel,
    tickets_por_dia: serie.rows,
    equipos_con_mas_incidencias: topEquipos.rows,
    por_tecnico: porTecnico.rows,
    periodo_dias: dias,
  });
}
