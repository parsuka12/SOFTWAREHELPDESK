<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { api } from '../api/http';
import { useUiStore } from '../stores/ui';
import { NIVELES, tiempoRestante } from '../utils/format';

const ui = useUiStore();
const tickets = ref([]);
const error = ref('');
const cargando = ref(true);
const ahora = ref(Date.now()); // fuerza el recálculo de los tiempos restantes
let timer;

async function cargar() {
  try {
    tickets.value = (await api('/tickets', { params: { vista: 'sin_resolver', orden: 'vencimiento', limit: 50 } })).data;
    error.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}
const restante = (t) => (ahora.value, tiempoRestante(t.fecha_limite, t.estado));

watch(() => ui.refresh, cargar);
onMounted(() => {
  cargar();
  timer = setInterval(() => (ahora.value = Date.now()), 30000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="pagina">
    <div class="pagina-head">
      <h1>Tickets por vencer</h1>
      <span class="muted">Ordenados por el tiempo que queda para responder</span>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="cargando" class="vacio">Cargando…</p>
    <p v-else-if="!tickets.length" class="vacio">No hay tickets pendientes. ¡Todo al día!</p>
    <div v-for="t in tickets" :key="t.id" class="fila-act" tabindex="0" @click="ui.abrirDetalle(t.id)" @keyup.enter="ui.abrirDetalle(t.id)">
      <i class="sq" :style="{ background: NIVELES[t.nivel].color }"></i>
      <span class="muted">#{{ t.numero }}</span>
      <strong>{{ t.nombre }}</strong>
      <span class="pill" :class="{ rojo: restante(t).vencido, warn: restante(t).urgente }">{{ restante(t).texto }}</span>
    </div>
  </div>
</template>
