// Datos de ejemplo SOLO para desarrollo: npm run seed
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';
import { env } from '../config/env.js';
import { horasPorNivel, calcularFechaLimite } from '../utils/sla.js';

if (env.NODE_ENV === 'production') {
  console.error('❌ El seed no se ejecuta en producción');
  process.exit(1);
}

try {
  const { rows: existentes } = await query('SELECT COUNT(*)::int AS n FROM tickets');
  if (existentes[0].n > 0) {
    console.log('ℹ️  Ya existen tickets, no se inserta nada');
  } else {
    const hash = await bcrypt.hash(env.SEED_PASSWORD, 10);
    const usuarios = [
      ['Administrador', 'admin@mesa.local', 'admin'],
      ['Técnico Demo', 'tecnico@mesa.local', 'tecnico'],
      ['Usuario Demo', 'usuario@mesa.local', 'usuario'],
    ];
    const ids = {};
    for (const [name, email, role] of usuarios) {
      const { rows } = await query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [name, email, hash, role],
      );
      ids[role] = rows[0].id;
    }

    const insertar = async (t, creadoHaceDias = 0, resuelto = false) => {
      const creado = new Date(Date.now() - creadoHaceDias * 86400000);
      const limite = calcularFechaLimite(creado, t.nivel);
      await query(
        `INSERT INTO tickets (nombre, descripcion, nivel, estado, equipo, cuenta, creado_por, asignado_a,
                              tiempo_respuesta_horas, fecha_limite, solucion, resuelto_en, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
        [
          t.nombre, t.descripcion, t.nivel, resuelto ? 'resuelto' : 'abierto', t.equipo, t.cuenta,
          ids.usuario, resuelto ? ids.tecnico : null, horasPorNivel(t.nivel), limite,
          t.solucion ?? null, resuelto ? new Date(creado.getTime() + 2 * 3600000) : null, creado,
        ],
      );
    };

    // Los 4 tickets de la captura de referencia (#1 a #4)
    await insertar({ nombre: 'Falla de internet', nivel: 'alto', equipo: 'pc-01', cuenta: 'restel',
      descripcion: 'Buen día equipo, informo que el equipo del agente Jaime se encuentra sin internet.' });
    await insertar({ nombre: 'Falla de mouse', nivel: 'bajo', equipo: 'pc-12', cuenta: 'restel',
      descripcion: 'Buen día equipo, informo que el mouse de la agente Daniela presenta fallas en la rueda.' });
    await insertar({ nombre: 'Sobrecalentamiento de CPU', nivel: 'alto', equipo: 'pc-05', cuenta: 'restel',
      descripcion: 'El agente ha detectado altas temperaturas en el pc-05 de la cuenta restel.' });
    await insertar({ nombre: 'Mantenimiento preventivo', nivel: 'medio', equipo: 'pc-24', cuenta: 'NCL',
      descripcion: 'El agente ha detectado una disminución en el rendimiento del pc-24 de la cuenta NCL.' });

    // Historial resuelto del pc-05 (para probar las sugerencias del asistente)
    await insertar({ nombre: 'Ventilador del CPU con ruido', nivel: 'medio', equipo: 'pc-05', cuenta: 'restel',
      descripcion: 'El pc-05 hace ruido fuerte y se apaga solo tras unas horas de uso.',
      solucion: 'Se limpió el polvo acumulado en el disipador y se reemplazó la pasta térmica. Temperaturas normalizadas.' },
      30, true);

    console.log(`✅ Seed completado. Usuarios (contraseña: ${env.SEED_PASSWORD}):`);
    usuarios.forEach(([, email, role]) => console.log(`   - ${email}  (${role})`));
  }
} catch (err) {
  console.error('❌ Error en el seed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
