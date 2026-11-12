<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Icon from './Icon.vue';
import { api } from '../api/http';
import { useUiStore } from '../stores/ui';
import { fechaHora } from '../utils/format';

const ui = useUiStore();
const abierto = ref(false);
const noLeidas = ref(0);
const lista = ref([]);
let timer;

async function contar() {
  try {
    noLeidas.value = (await api('/notificaciones/conteo')).no_leidas;
  } catch {
    /* se reintenta en el siguiente ciclo */
  }
}
async function alternar() {
  abierto.value = !abierto.value;
  if (!abierto.value) return;
  try {
    lista.value = (await api('/notificaciones', { params: { limit: 30 } })).data;
  } catch (e) {
    ui.aviso(e.message, 'error');
  }
}
async function abrirNotificacion(n) {
  abierto.value = false;
  if (!n.leida) {
    n.leida = true;
    noLeidas.value = Math.max(0, noLeidas.value - 1);
    api(`/notificaciones/${n.id}/leer`, { method: 'PATCH' }).catch(() => {});
  }
  if (n.ticket_id) ui.abrirDetalle(n.ticket_id);
}
async function marcarTodas() {
  await api('/notificaciones/leer-todas', { method: 'PATCH' });
  lista.value.forEach((n) => (n.leida = true));
  noLeidas.value = 0;
}

onMounted(() => {
  contar();
  timer = setInterval(contar, 30000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="rel campana">
    <button class="icon-btn" :aria-label="`Notificaciones (${noLeidas} sin leer)`" @click="alternar">
      <Icon name="bell" :size="28" />
      <span v-if="noLeidas" class="punto">{{ noLeidas > 9 ? '9+' : noLeidas }}</span>
    </button>
    <template v-if="abierto">
      <div class="backdrop" @click="abierto = false"></div>
      <div class="menu notifs">
        <div class="notifs-head">
          <span>Notificaciones</span>
          <button class="link" @click="marcarTodas">Marcar todas como leídas</button>
        </div>
        <p v-if="!lista.length" class="vacio">No tienes notificaciones.</p>
        <ul>
          <li v-for="n in lista" :key="n.id" :class="{ nueva: !n.leida }">
            <button @click="abrirNotificacion(n)">
              {{ n.mensaje }}
              <small>{{ fechaHora(n.created_at) }}</small>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
