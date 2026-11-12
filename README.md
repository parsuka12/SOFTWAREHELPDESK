# 🎫 Mesa de Ayuda con Asistente de IA

Sistema de mesa de ayuda (help desk) con tickets por nivel de prioridad, SLA automático,
dashboard de métricas, notificaciones y un asistente de IA (Google Gemini) que sugiere
soluciones usando el historial de tickets del mismo equipo.

## Estructura

```
mesa-de-ayuda/
├── backend/     API REST (Node.js + Express + PostgreSQL + Gemini)
└── frontend/    Interfaz web (Vue 3 + Vite)
```

## Inicio rápido

1. Backend: sigue [`backend/README.md`](backend/README.md) (queda en `http://localhost:4000`).
2. Frontend: sigue [`frontend/README.md`](frontend/README.md) (queda en `http://localhost:5173`).
3. Entra con un usuario del seed, por ejemplo `tecnico@mesa.local` (contraseña `Cambiar123!`).
