<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { NIVELES, fechaHora } from '../utils/format';

const props = defineProps({ s: { type: Object, required: true }, ticket: { type: Object, required: true }, puedeAplicar: Boolean });
const emit = defineEmits(['aplicar-nivel']);
const auth = useAuthStore();
const ui = useUiStore();
const nivel = computed(() => NIVELES[props.s.nivel_sugerido]);
</script>

<template>
  <div class="sug">
    <p><strong>{{ s.resumen }}</strong></p>
    <p style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap">
      <span v-if="s.problema_recurrente" class="pill warn">Problema recurrente en este equipo</span>
      <span v-if="s.requiere_escalamiento" class="pill rojo">Requiere escalamiento</span>
    </p>

    <template v-if="s.causas_probables?.length">
      <h4>Causas probables</h4>
      <ul><li v-for="(c, i) in s.causas_probables" :key="i">{{ c }}</li></ul>
    </template>

    <template v-if="s.pasos_solucion?.length">
      <h4>Pasos sugeridos</h4>
      <ol><li v-for="(p, i) in s.pasos_solucion" :key="i">{{ p }}</li></ol>
    </template>

    <h4>Historial del equipo</h4>
    <p>{{ s.analisis_historial || 'Sin información de historial.' }}</p>
    <p v-if="s.tickets_relacionados?.length" style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center">
      Relacionados:
      <button v-for="n in s.tickets_relacionados" :key="n" class="chip" @click="ui.abrirDetalle(n)">#{{ n }}</button>
    </p>

    <h4>Nivel sugerido</h4>
    <p style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
      <i class="sq" :style="{ background: nivel.color }"></i> <strong>{{ nivel.label }}</strong>
      <button v-if="puedeAplicar && auth.esStaff && s.nivel_sugerido !== ticket.nivel" class="btn btn-chico" @click="emit('aplicar-nivel', s.nivel_sugerido)">
        Aplicar este nivel
      </button>
    </p>
    <p v-if="s.justificacion_nivel" class="muted" style="margin-top: 4px">{{ s.justificacion_nivel }}</p>

    <p class="muted" style="margin-top: 12px; font-size: 12px">
      Consultó {{ s.historial_consultado }} ticket(s) del equipo · {{ s.modelo }} · {{ fechaHora(s.created_at) }}
    </p>
  </div>
</template>
