<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import Icon from './Icon.vue';

defineProps({ titulo: { type: String, required: true } });
const emit = defineEmits(['cerrar']);
const alTeclear = (e) => e.key === 'Escape' && emit('cerrar');
onMounted(() => window.addEventListener('keydown', alTeclear));
onBeforeUnmount(() => window.removeEventListener('keydown', alTeclear));
</script>

<template>
  <div class="overlay" @mousedown.self="emit('cerrar')">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="titulo">
      <div class="modal-head">
        <h2>{{ titulo }}</h2>
        <button class="icon-btn" aria-label="Cerrar" @click="emit('cerrar')"><Icon name="x" /></button>
      </div>
      <slot />
    </div>
  </div>
</template>
