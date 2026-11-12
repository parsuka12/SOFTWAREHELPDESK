# Backend – Mesa de Ayuda

API REST con **Node.js + Express + PostgreSQL** y asistente de IA con **Google Gemini**.

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (o Docker)
- Clave de API de Gemini: https://aistudio.google.com/apikey

## Puesta en marcha

```bash
cd backend
cp .env.example .env        # edita JWT_SECRET, DATABASE_URL y GEMINI_API_KEY
npm install
npm run migrate             # crea las tablas
npm run seed                # (solo desarrollo) usuarios y tickets de ejemplo
npm run dev                 # http://localhost:4000/api
```

Con Docker (API + PostgreSQL): `docker compose up --build`

Usuarios del seed (contraseña `SEED_PASSWORD`, por defecto `Cambiar123!`):
`admin@mesa.local`, `tecnico@mesa.local`, `usuario@mesa.local`.

## Reglas de negocio

| Nivel | Cuadrito | Tiempo de respuesta (SLA) |
|-------|----------|---------------------------|
| alto  | 🟥 rojo     | 3 h  |
| medio | 🟨 amarillo | 8 h  |
| bajo  | 🟩 verde    | 16 h |

- El tiempo de respuesta es **automático** según el nivel (configurable en `.env`). Si el nivel cambia, la fecha límite se recalcula desde la creación del ticket.
- El **número del ticket** (#1, #2…) es su `id`.
- **Roles:** `usuario` (solo ve y edita sus tickets), `tecnico` y `admin` (ven todo, asignan, resuelven, archivan, usan la IA y el dashboard). El registro público siempre crea `usuario`; el admin cambia roles.
- **Notificaciones:** dentro de la app (campana) y por correo (sin `SMTP_HOST` se imprimen en consola). Se envían al crear tickets, asignar, cambiar estado/nivel, comentar y cuando un ticket está por vencer (<1 h) o vencido.
- **Asistente IA:** solo cuando el técnico lo pide. Usa el ticket, sus comentarios y el historial de tickets del **mismo equipo** (ordenados por similitud) para sugerir causas, pasos de solución, si el problema es recurrente y qué nivel corresponde.

## Endpoints

Todas las rutas llevan el prefijo `/api` y (salvo registro/login) requieren `Authorization: Bearer <token>`.

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/registro` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Usuario actual |

### Tickets
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tickets` | Lista con vistas y filtros (ver abajo) |
| GET | `/tickets/vistas/conteos` | Contador de cada vista del panel izquierdo |
| POST | `/tickets` | `{ nombre, descripcion, nivel, equipo?, cuenta? }` |
| GET | `/tickets/:id` | Detalle |
| PATCH | `/tickets/:id` | Editar (`nombre, descripcion, nivel, estado, equipo, cuenta, asignado_a, solucion`) |
| POST | `/tickets/:id/resolver` | `{ solucion }` (técnico/admin) |
| POST / DELETE | `/tickets/:id/observar` | Activar / quitar la estrella |
| POST | `/tickets/:id/archivar` · `/desarchivar` | Archivo (técnico/admin) |
| DELETE | `/tickets/:id` | Enviar a papelera (técnico/admin) |
| POST | `/tickets/:id/restaurar` | Sacar de papelera |
| DELETE | `/tickets/:id/permanente` | Eliminar definitivamente (admin, solo si está en papelera) |
| GET / POST | `/tickets/:id/comentarios` | Comentarios |
| POST | `/tickets/:id/sugerencias-ia` | Pide sugerencias a Gemini (técnico/admin) |
| GET | `/tickets/:id/sugerencias-ia` | Sugerencias anteriores del ticket |

**Parámetros de `GET /tickets`:**
- `vista`: `nuevo_y_mis_abiertos` · `observando` · `creados` · `todos` · `sin_resolver` · `archivados` · `papelera`
- Filtros: `estado` (`abierto,en_proceso,resuelto,cerrado`, separados por coma), `nivel` (`bajo,medio,alto`), `equipo`, `cuenta`, `asignado_a` (id o `sin_asignar`), `creado_por`, `vencidos=true`, `desde`/`hasta` (`AAAA-MM-DD`), `q` (texto o número de ticket)
- `orden`: `recientes` · `antiguos` · `vencimiento` · `prioridad`
- `page`, `limit` (máx. 100)

Cada ticket incluye `numero`, `color` (`verde|amarillo|rojo`), `color_hex`, `tiempo_respuesta` (`"3h"`), `fecha_limite`, `vencido` y `observando`.

### Dashboard y notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard/metricas?dias=30` | Totales, por nivel, cumplimiento de SLA, tiempo promedio de resolución, tickets por día, equipos con más incidencias, carga por técnico (técnico/admin) |
| GET | `/notificaciones` | Lista (`?solo_no_leidas=true`) |
| GET | `/notificaciones/conteo` | Número de la campana |
| PATCH | `/notificaciones/:id/leer` · `/notificaciones/leer-todas` | Marcar como leídas |

### Correos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/correos` | `{ para, asunto, mensaje, ticket_id? }` (técnico/admin). Si hay `ticket_id` queda un comentario en el ticket. Sin SMTP configurado el correo se simula en consola |

### Usuarios (admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios` | Lista de usuarios |
| POST | `/usuarios` | Crear con rol |
| PATCH | `/usuarios/:id` | Cambiar `role` / `active` |
| GET | `/usuarios/tecnicos` | Técnicos para asignar (técnico/admin) |

## Estructura

```
backend/
├── src/
│   ├── config/        env y conexión a PostgreSQL
│   ├── controllers/   lógica de cada recurso
│   ├── db/            schema.sql, migrate.js, seed.js
│   ├── middlewares/   auth, validación, errores, rate limit
│   ├── routes/        definición de endpoints
│   ├── schemas/       validaciones (zod)
│   ├── services/      tickets, notificaciones, correo, SLA y ai/ (Gemini)
│   ├── utils/
│   ├── app.js
│   └── server.js
├── .env.example · Dockerfile · docker-compose.yml · package.json
```

## Notas de seguridad

- Cambia `JWT_SECRET` y las contraseñas del seed; no ejecutes el seed en producción.
- Nunca subas tu `.env` (ya está en `.gitignore`).
- Los datos del ticket se envían a Gemini como *datos* (no instrucciones) y la ruta de IA tiene límite de 10 consultas/min por usuario.
