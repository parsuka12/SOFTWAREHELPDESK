<script setup>
import { computed, onMounted, ref } from 'vue';
import Icon from './Icon.vue';
import SugerenciaView from './SugerenciaView.vue';
import { api } from '../api/http';

const props = defineProps({ ticket: { type: Object, required: true } });
const emit = defineEmits(['aplicar-nivel']);

const historial = ref([]);
const pidiendo = ref(false);
const error = ref('');

const actual = computed(() => historial.value[0]);
const anteriores = computed(() => historial.value.slice(1));

onMounted(async () => {
  try {
    historial.value = (await api(`/tickets/${props.ticket.id}/sugerencias-ia`)).data;
  } catch {
    /* sin historial previo */
  }
});

async function pedir() {
  pidiendo.value = true;
  error.value = '';
  try {
    const { sugerencia } = await api(`/tickets/${props.ticket.id}/sugerencias-ia`, { method: 'POST' });
    historial.value.unshift(sugerencia);
  } catch (e) {
    error.value = e.message;
  } finally {
    pidiendo.value = false;
  }
}
</script>

<template>
  <div>
    <p class="muted" style="margin-bottom: 12px; line-height: 1.5">
      Gemini analiza este ticket y el historial de tickets del mismo equipo
      <strong>{{ ticket.equipo || '(sin equipo registrado)' }}</strong> para sugerir una solución.
    </p>
    <button class="btn btn-primario" :disabled="pidiendo" @click="pedir">
      <Icon name="sparkles" :size="18" /> {{ pidiendo ? 'Consultando a Gemini…' : actual ? 'Pedir nuevas sugerencias' : 'Pedir sugerencias' }}
    </button>
    <p v-if="error" class="error" role="alert" style="margin-top: 12px">{{ error }}</p>

    <div style="margin-top: 16px">
      <SugerenciaView v-if="actual" :s="actual" :ticket="ticket" puede-aplicar @aplicar-nivel="(n) => emit('aplicar-nivel', n)" />
      <p v-else-if="!pidiendo" class="vacio">Aún no hay sugerencias para este ticket.</p>

      <details v-if="anteriores.length">
        <summary class="muted" style="cursor: pointer; margin-bottom: 10px">Sugerencias anteriores ({{ anteriores.length }})</summary>
        <SugerenciaView v-for="s in anteriores" :key="s.id" :s="s" :ticket="ticket" />
      </details>
    </div>
  </div>
</template>
