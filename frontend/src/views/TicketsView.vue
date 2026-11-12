<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TicketCard from '../components/TicketCard.vue';
import ViewsPanel from '../components/ViewsPanel.vue';
import FiltersPanel from '../components/FiltersPanel.vue';
import Icon from '../components/Icon.vue';
import { api } from '../api/http';
import { useUiStore } from '../stores/ui';
import { VISTAS } from '../utils/format';
import { aParams, defaultFiltros } from '../utils/filtros';

const ui = useUiStore();

const vista = ref('sin_resolver');
const filtros = ref(defaultFiltros(vista.value));
const page = ref(1);
const limit = 20;
const tickets = ref([]);
const total = ref(0);
const conteos = ref({});
const cargando = ref(true);
const error = ref('');
const ancho = ref(window.innerWidth);
let peticion = 0;

const paginas = computed(() => Math.max(1, Math.ceil(total.value / limit)));
const scrim = computed(() => (ancho.value <= 1100 && ui.panelFiltros) || (ancho.value <= 760 && ui.panelVistas));
const etiquetaVista = computed(() => VISTAS.find((v) => v.id === vista.value)?.label ?? 'Tickets');

async function cargar() {
  const mia = ++peticion;
  cargando.value = true;
  error.value = '';
  try {
    const r = await api('/tickets', { params: { vista: vista.value, ...aParams(filtros.value), page: page.value, limit } });
    if (mia !== peticion) return; // llegó una respuesta más reciente
    tickets.value = r.data;
    total.value = r.total;
    ui.totalVista = r.total;
  } catch (e) {
    if (mia === peticion) error.value = e.message;
  } finally {
    if (mia === peticion) cargando.value = false;
  }
}

async function cargarConteos() {
  try {
    conteos.value = (await api('/tickets/vistas/conteos')).data;
  } catch {
    /* los contadores son opcionales */
  }
}

function cambiarVista(id) {
  vista.value = id;
  filtros.value = defaultFiltros(id);
  page.value = 1;
  if (ancho.value <= 760) ui.panelVistas = false;
}
function aplicarFiltros(f) {
  filtros.value = f;
  page.value = 1;
  if (ancho.value <= 1100) ui.panelFiltros = false;
}

async function observar(t) {
  try {
    const r = await api(`/tickets/${t.id}/observar`, { method: t.observando ? 'DELETE' : 'POST' });
    t.observando = r.observando;
    cargarConteos();
    if (vista.value === 'observando' && !r.observando) cargar();
  } catch (e) {
    ui.aviso(e.message, 'error');
  }
}

watch([vista, filtros, page], cargar, { deep: true });
watch(() => ui.refresh, () => { cargar(); cargarConteos(); });
watch(etiquetaVista, (v) => (ui.tituloVista = v), { immediate: true });

const alRedimensionar = () => (ancho.value = window.innerWidth);
onMounted(() => {
  cargar();
  cargarConteos();
  window.addEventListener('resize', alRedimensionar);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', alRedimensionar);
  ui.totalVista = null;
});
</script>

<template>
  <div class="tickets">
    <aside class="views" :class="{ abierto: ui.panelVistas }" aria-label="Vistas">
      <ViewsPanel :model-value="vista" :conteos="conteos" @update:model-value="cambiarVista" />
    </aside>

    <section class="lista" aria-live="polite">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else-if="cargando && !tickets.length" class="vacio">Cargando tickets…</p>
      <p v-else-if="!tickets.length" class="vacio">No hay tickets en esta vista. Prueba con otros filtros o crea uno nuevo desde «Nuevo».</p>

      <TicketCard v-for="t in tickets" :key="t.id" :ticket="t" @abrir="ui.abrirDetalle($event.id)" @observar="observar" />

      <nav v-if="paginas > 1" class="paginacion" aria-label="Paginación">
        <button class="btn btn-chico" :disabled="page <= 1" aria-label="Página anterior" @click="page--"><Icon name="chevron-left" :size="18" /></button>
        <span>Página {{ page }} de {{ paginas }}</span>
        <button class="btn btn-chico" :disabled="page >= paginas" aria-label="Página siguiente" @click="page++"><Icon name="chevron-right" :size="18" /></button>
      </nav>
    </section>

    <aside class="filtros" :class="{ abierto: ui.panelFiltros }" aria-label="Filtros">
      <FiltersPanel :aplicado="filtros" :vista="vista" @aplicar="aplicarFiltros" />
    </aside>

    <div v-if="scrim" class="scrim" @click="ui.panelFiltros = false; ui.panelVistas = false"></div>
  </div>
</template>
