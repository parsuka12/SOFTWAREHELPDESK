<script setup>
import Icon from './Icon.vue';
import { NIVELES, colorAvatar, inicial } from '../utils/format';

defineProps({ ticket: { type: Object, required: true } });
defineEmits(['abrir', 'observar']);
</script>

<template>
  <article class="ticket" tabindex="0" @click="$emit('abrir', ticket)" @keyup.enter="$emit('abrir', ticket)">
    <div class="t-main">
      <div class="t-head">
        <span class="avatar" :style="{ background: colorAvatar(ticket.creado_por_nombre) }" :title="ticket.creado_por_nombre">
          {{ inicial(ticket.creado_por_nombre) }}
        </span>
        <span class="t-nombre">{{ ticket.nombre }}</span>
        <span class="t-num">#{{ ticket.numero }}</span>
        <button
          class="star"
          :class="{ on: ticket.observando }"
          :aria-label="ticket.observando ? 'Dejar de observar' : 'Observar ticket'"
          :aria-pressed="ticket.observando"
          @click.stop="$emit('observar', ticket)"
        >
          <Icon name="star" :size="22" />
        </button>
        <span v-if="ticket.vencido" class="tag-vencido">Vencido</span>
      </div>
      <p class="t-desc">{{ ticket.descripcion }}</p>
    </div>
    <div class="t-side">
      <div class="t-prio">
        <span>Prioridad</span>
        <span class="nivel">
          {{ NIVELES[ticket.nivel].label }}
          <i class="sq" :style="{ background: NIVELES[ticket.nivel].color }"></i>
        </span>
      </div>
      <div class="t-tiempo">Tiempo de respuesta: {{ ticket.tiempo_respuesta }}</div>
    </div>
  </article>
</template>
