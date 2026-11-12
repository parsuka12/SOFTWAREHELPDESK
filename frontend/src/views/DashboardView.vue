<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import ChartCanvas from '../components/ChartCanvas.vue';
import { api } from '../api/http';
import { useUiStore } from '../stores/ui';
import { NIVELES } from '../utils/format';

const ui = useUiStore();
const dias = ref(30);
const datos = ref(null);
const error = ref('');

async function cargar() {
  try {
    datos.value = await api('/dashboard/metricas', { params: { dias: dias.value } });
    error.value = '';
  } catch (e) {
    error.value = e.message;
  }
}
onMounted(cargar);
watch(dias, cargar);
watch(() => ui.refresh, cargar);

const t = computed(() => datos.value?.totales);
const kpis = computed(() =>
  t.value
    ? [
        { l: 'Total de tickets', v: t.value.total },
        { l: 'Abiertos', v: t.value.abiertos },
        { l: 'En proceso', v: t.value.en_proceso },
        { l: 'Resueltos', v: t.value.resueltos },
        { l: 'Vencidos', v: t.value.vencidos, alerta: t.value.vencidos > 0 },
        { l: 'Sin asignar', v: t.value.sin_asignar },
        { l: 'Cumplimiento de SLA', v: t.value.cumplimiento_sla_pct == null ? '—' : `${t.value.cumplimiento_sla_pct}%` },
        { l: 'Resolución promedio', v: t.value.tiempo_promedio_resolucion_horas == null ? '—' : `${t.value.tiempo_promedio_resolucion_horas} h` },
      ]
    : [],
);

const opciones = { responsive: true, maintainAspectRatio: false };
const porNivel = computed(() => ({
  type: 'doughnut',
  data: {
    labels: datos.value.por_nivel.map((n) => NIVELES[n.nivel].label),
    datasets: [{ data: datos.value.por_nivel.map((n) => n.total), backgroundColor: datos.value.por_nivel.map((n) => NIVELES[n.nivel].color) }],
  },
  options: { ...opciones, plugins: { legend: { position: 'bottom' } } },
}));
const porDia = computed(() => ({
  type: 'line',
  data: {
    labels: datos.value.tickets_por_dia.map((d) => d.fecha.slice(5).split('-').reverse().join('/')),
    datasets: [
      { label: 'Creados', data: datos.value.tickets_por_dia.map((d) => d.creados), borderColor: '#1f4e6f', backgroundColor: '#1f4e6f', tension: 0.3 },
      { label: 'Resueltos', data: datos.value.tickets_por_dia.map((d) => d.resueltos), borderColor: '#22c55e', backgroundColor: '#22c55e', tension: 0.3 },
    ],
  },
  options: { ...opciones, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
}));
const equipos = computed(() => ({
  type: 'bar',
  data: {
    labels: datos.value.equipos_con_mas_incidencias.map((e) => e.equipo),
    datasets: [{ label: 'Tickets', data: datos.value.equipos_con_mas_incidencias.map((e) => e.total), backgroundColor: '#1f4e6f' }],
  },
  options: { ...opciones, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
}));
const tecnicos = computed(() => ({
  type: 'bar',
  data: {
    labels: datos.value.por_tecnico.map((x) => x.name),
    datasets: [
      { label: 'En curso', data: datos.value.por_tecnico.map((x) => x.en_curso), backgroundColor: '#e8d000' },
      { label: 'Resueltos', data: datos.value.por_tecnico.map((x) => x.resueltos), backgroundColor: '#22c55e' },
    ],
  },
  options: { ...opciones, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
}));
</script>

<template>
  <div class="pagina">
    <div class="pagina-head">
      <h1>Métricas</h1>
      <label style="display: flex; align-items: center; gap: 8px">
        Período
        <select v-model.number="dias" class="select" style="width: auto">
          <option :value="7">Últimos 7 días</option>
          <option :value="30">Últimos 30 días</option>
          <option :value="90">Últimos 90 días</option>
        </select>
      </label>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!datos" class="vacio">Cargando métricas…</p>

    <template v-else>
      <div class="kpis">
        <div v-for="k in kpis" :key="k.l" class="kpi" :class="{ alerta: k.alerta }"><span>{{ k.l }}</span><strong>{{ k.v }}</strong></div>
      </div>

      <div class="graficas">
        <section class="grafica"><h2>Tickets por nivel</h2><ChartCanvas :config="porNivel" /></section>
        <section class="grafica"><h2>Creados y resueltos por día</h2><ChartCanvas :config="porDia" /></section>
        <section class="grafica"><h2>Equipos con más incidencias</h2><ChartCanvas v-if="datos.equipos_con_mas_incidencias.length" :config="equipos" /><p v-else class="vacio">Aún no hay equipos registrados.</p></section>
        <section class="grafica"><h2>Carga por técnico</h2><ChartCanvas v-if="datos.por_tecnico.length" :config="tecnicos" /><p v-else class="vacio">Sin técnicos activos.</p></section>
      </div>

      <h2 style="margin: 22px 0 10px; font-size: 16px">Nivel y tiempo de respuesta</h2>
      <div class="tabla-wrap">
        <table class="tabla">
          <thead><tr><th>Nivel</th><th>Tiempo de respuesta</th><th>Total</th><th>Sin resolver</th></tr></thead>
          <tbody>
            <tr v-for="n in datos.por_nivel" :key="n.nivel">
              <td><i class="sq" :style="{ background: NIVELES[n.nivel].color, verticalAlign: 'middle', marginRight: '8px' }"></i>{{ NIVELES[n.nivel].label }}</td>
              <td>{{ n.tiempo_respuesta_horas }} h</td><td>{{ n.total }}</td><td>{{ n.sin_resolver }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
