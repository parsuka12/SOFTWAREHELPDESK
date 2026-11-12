<script setup>
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { VISTAS } from '../utils/format';

defineProps({ modelValue: { type: String, required: true }, conteos: { type: Object, default: () => ({}) } });
const emit = defineEmits(['update:modelValue']);

const busqueda = ref('');
const abierto = ref(true);
const filtradas = computed(() => VISTAS.filter((v) => v.label.toLowerCase().includes(busqueda.value.trim().toLowerCase())));
const principales = computed(() => filtradas.value.filter((v) => !v.aparte));
const aparte = computed(() => filtradas.value.filter((v) => v.aparte));
</script>

<template>
  <div>
    <label class="buscar-vista">
      <Icon name="search" :size="22" />
      <input v-model="busqueda" placeholder="Buscar vista" aria-label="Buscar vista" />
    </label>

    <button class="grupo" :aria-expanded="abierto" @click="abierto = !abierto">
      <span>Predeterminado</span>
      <Icon name="chevron-down" :size="22" :style="{ transform: abierto ? 'none' : 'rotate(-90deg)' }" />
    </button>

    <ul v-show="abierto">
      <li v-for="v in principales" :key="v.id">
        <button class="vista" :class="{ activa: modelValue === v.id }" @click="emit('update:modelValue', v.id)">
          <Icon :name="v.icon" :size="24" />
          <span>{{ v.label }}</span>
          <em v-if="conteos[v.id]">{{ conteos[v.id] }}</em>
        </button>
      </li>
    </ul>

    <hr v-if="principales.length && aparte.length" />

    <ul>
      <li v-for="v in aparte" :key="v.id">
        <button class="vista" :class="{ activa: modelValue === v.id }" @click="emit('update:modelValue', v.id)">
          <Icon :name="v.icon" :size="24" />
          <span>{{ v.label }}</span>
          <em v-if="conteos[v.id]">{{ conteos[v.id] }}</em>
        </button>
      </li>
    </ul>

    <p v-if="!filtradas.length" class="muted" style="padding: 8px">No hay vistas con ese nombre.</p>
  </div>
</template>
