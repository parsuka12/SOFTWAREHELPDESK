<script setup>
import Modal from './Modal.vue';
import { NIVELES } from '../utils/format';

const emit = defineEmits(['cerrar']);
</script>

<template>
  <Modal titulo="Ayuda" @cerrar="emit('cerrar')">
    <h3 style="margin-bottom: 8px">Niveles y tiempo de respuesta</h3>
    <p class="muted" style="margin-bottom: 10px">El tiempo que tiene el técnico para responder o resolver depende del nivel del ticket.</p>
    <ul style="display: grid; gap: 8px; margin-bottom: 18px">
      <li v-for="(n, clave) in NIVELES" :key="clave" style="display: flex; align-items: center; gap: 10px">
        <i class="sq" :style="{ background: n.color }"></i> <strong>{{ n.label }}</strong> — {{ n.horas }} horas
      </li>
    </ul>
    <h3 style="margin-bottom: 8px">Consejos</h3>
    <ul style="display: grid; gap: 6px; list-style: disc; padding-left: 20px; line-height: 1.5">
      <li>La estrella marca los tickets que quieres observar; los ves en «Tickets que estoy observando».</li>
      <li>Los técnicos pueden pedir sugerencias al asistente de IA desde el detalle del ticket.</li>
      <li>El asistente revisa el historial de tickets del mismo equipo para encontrar problemas repetidos.</li>
      <li>Define el equipo (por ejemplo «pc-05») al crear el ticket para que el historial sea útil.</li>
    </ul>
  </Modal>
</template>
