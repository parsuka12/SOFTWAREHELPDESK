const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(status, message, detalles) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

// Mensaje legible, incluyendo los detalles de validación del backend
export const mensajeError = (e) =>
  e?.detalles?.length ? e.detalles.map((d) => d.mensaje).join('. ') : e?.message || 'Ocurrió un error inesperado';

export async function api(ruta, { method = 'GET', body, params } = {}) {
  const token = localStorage.getItem('token');
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length))
          .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)]),
      )
    : '';

  let res;
  try {
    res = await fetch(`${BASE}${ruta}${qs}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sesión vencida: main.js escucha este evento y cierra la sesión
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:logout'));
    throw new ApiError(res.status, data.error || 'Error inesperado', data.detalles);
  }
  return data;
}
