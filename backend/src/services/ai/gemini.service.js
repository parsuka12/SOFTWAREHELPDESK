import { env } from '../../config/env.js';
import { HttpError } from '../../utils/httpError.js';

// Cliente mínimo de la API REST de Gemini (sin dependencias externas).
// Docs: https://ai.google.dev/api/generate-content
export async function generarJson({ sistema, prompt }) {
  if (!env.GEMINI_API_KEY) throw new HttpError(503, 'El asistente de IA no está configurado (falta GEMINI_API_KEY)');

  const url = `${env.GEMINI_BASE_URL}/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (err) {
    console.error('Error de red con Gemini:', err.message);
    throw new HttpError(502, 'No se pudo conectar con el asistente de IA');
  }

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    console.error(`Gemini respondió ${res.status}:`, detalle.slice(0, 500));
    throw new HttpError(502, 'El asistente de IA no pudo procesar la solicitud');
  }

  const data = await res.json();
  const texto = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!texto) throw new HttpError(502, 'El asistente de IA no devolvió contenido');

  try {
    return JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, '').trim());
  } catch {
    console.error('Respuesta de Gemini no es JSON válido:', texto.slice(0, 300));
    throw new HttpError(502, 'El asistente de IA devolvió una respuesta inválida');
  }
}
