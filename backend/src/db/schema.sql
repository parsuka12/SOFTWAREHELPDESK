-- Esquema de la mesa de ayuda (idempotente: se puede ejecutar varias veces)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'tecnico', 'usuario')),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- El id del ticket es el número visible (#1, #2, ...)
CREATE TABLE IF NOT EXISTS tickets (
  id                     SERIAL PRIMARY KEY,
  nombre                 VARCHAR(200) NOT NULL,
  descripcion            TEXT NOT NULL,
  nivel                  VARCHAR(10) NOT NULL CHECK (nivel IN ('bajo', 'medio', 'alto')),
  estado                 VARCHAR(20) NOT NULL DEFAULT 'abierto'
                         CHECK (estado IN ('abierto', 'en_proceso', 'resuelto', 'cerrado')),
  equipo                 VARCHAR(120),
  cuenta                 VARCHAR(120),
  creado_por             INT NOT NULL REFERENCES users(id),
  asignado_a             INT REFERENCES users(id) ON DELETE SET NULL,
  tiempo_respuesta_horas INT NOT NULL,
  fecha_limite           TIMESTAMPTZ NOT NULL,
  alerta_sla_enviada     BOOLEAN NOT NULL DEFAULT false,
  solucion               TEXT,
  resuelto_en            TIMESTAMPTZ,
  archivado              BOOLEAN NOT NULL DEFAULT false,
  eliminado_en           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_estado       ON tickets (estado);
CREATE INDEX IF NOT EXISTS idx_tickets_creado_por   ON tickets (creado_por);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado_a   ON tickets (asignado_a);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_limite ON tickets (fecha_limite);
CREATE INDEX IF NOT EXISTS idx_tickets_equipo       ON tickets (lower(trim(equipo)));

-- Estrella: "Tickets que estoy observando"
CREATE TABLE IF NOT EXISTS ticket_watchers (
  ticket_id  INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id         SERIAL PRIMARY KEY,
  ticket_id  INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id),
  mensaje    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments (ticket_id);

-- Sugerencias generadas por el asistente IA (historial por ticket)
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id            SERIAL PRIMARY KEY,
  ticket_id     INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  solicitado_por INT NOT NULL REFERENCES users(id),
  contenido     JSONB NOT NULL,
  modelo        VARCHAR(80) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_ticket ON ai_suggestions (ticket_id);

-- Notificaciones dentro de la app (la campana)
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id  INT REFERENCES tickets(id) ON DELETE CASCADE,
  tipo       VARCHAR(40) NOT NULL,
  mensaje    TEXT NOT NULL,
  leida      BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, leida, created_at DESC);
