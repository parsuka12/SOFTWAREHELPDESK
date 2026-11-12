# Frontend – Mesa de Ayuda

Interfaz web en **Vue 3 + Vite** (Pinia, Vue Router y Chart.js). Responsive: en escritorio muestra los tres paneles de la captura de diseño; en tablet los filtros pasan a un panel lateral; en móvil la barra de íconos baja al pie y las vistas se abren desde el menú.

## Requisitos

- Node.js 20+
- El [backend](../backend/README.md) corriendo (por defecto en `http://localhost:4000`)

## Puesta en marcha

```bash
cd frontend
cp .env.example .env       # ajusta VITE_API_URL si tu backend usa otra dirección
npm install
npm run dev                # http://localhost:5173
```

En el backend, `CORS_ORIGIN` debe incluir la URL del frontend (por defecto `http://localhost:5173`).

Para producción: `npm run build` genera la carpeta `dist/` lista para servir con cualquier hosting estático.

## Pantallas

| Ruta | Quién | Descripción |
|------|-------|-------------|
| `/login`, `/registro` | Público | Inicio de sesión y registro (el registro crea rol `usuario`) |
| `/tickets` | Todos | Lista de tickets con las 7 vistas, filtros, búsqueda, estrella y paginación |
| `/actividad` | Técnico/Admin | Tickets sin resolver ordenados por tiempo restante (reloj) |
| `/dashboard` | Técnico/Admin | Métricas y gráficas |
| `/usuarios` | Admin | Crear usuarios y cambiar roles |
| `/ajustes` | Todos | Mi cuenta y leyenda de niveles |

**Barra superior:** funnel (muestra/oculta filtros) · botón **IA** (abre el asistente Gemini del ticket abierto, solo técnicos/admin) · **Nuevo** (ticket o correo) · campana con notificaciones (se actualiza cada 30 s) · ayuda · menú de cuenta.

**Detalle del ticket** (clic en un ticket): datos, cambio de nivel/estado/asignación (técnico/admin), resolver con solución, archivar, papelera, comentarios y pestaña **Asistente IA**.

## Cambiar el logo

Reemplaza `public/logo.svg` por tu archivo (mismo nombre). Si es PNG, cambia las referencias a `/logo.svg` en `index.html`, `src/layouts/AppLayout.vue`, `src/views/LoginView.vue` y `src/views/RegisterView.vue`.

## Colores de los niveles

Están en `src/utils/format.js` (`NIVELES`): alta = rojo, media = amarillo, baja = verde. Las horas que se muestran en «Nuevo ticket» deben coincidir con las del backend (`SLA_HORAS_*` en su `.env`).

## Estructura

```
frontend/
├── public/logo.svg
├── src/
│   ├── api/          cliente HTTP
│   ├── components/   tarjeta de ticket, paneles, modales, detalle, asistente IA
│   ├── layouts/      barra de íconos + barra superior
│   ├── router/       rutas y permisos por rol
│   ├── stores/       Pinia: sesión (auth) y estado de interfaz (ui)
│   ├── styles/main.css
│   ├── utils/        niveles, vistas, filtros, formatos
│   ├── views/        pantallas
│   ├── App.vue · main.js
├── .env.example · index.html · vite.config.js · package.json
```
