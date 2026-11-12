<script setup>
import { ref } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({ modelValue: { type: Array, default: () => [] }, options: { type: Array, required: true } });
const emit = defineEmits(['update:modelValue']);
const abierto = ref(false);

const etiqueta = (v) => props.options.find((o) => o.value === v)?.label ?? v;
const alternar = (v) => {
  const s = new Set(props.modelValue);
  s.has(v) ? s.delete(v) : s.add(v);
  emit('update:modelValue', [...s]);
};
const quitar = (v) => emit('update:modelValue', props.modelValue.filter((x) => x !== v));
</script>

<template>
  <div class="chipsel">
    <div class="chipsel-box" @click="abierto = !abierto">
      <div class="chipsel-chips">
        <span v-for="v in modelValue" :key="v" class="chip">
          {{ etiqueta(v) }}
          <button type="button" :aria-label="`Quitar ${etiqueta(v)}`" @click.stop="quitar(v)">x</button>
        </span>
        <span v-if="!modelValue.length" class="muted">Cualquiera</span>
      </div>
      <Icon name="chevron-down" :size="20" />
    </div>
    <template v-if="abierto">
      <div class="backdrop" @click="abierto = false"></div>
      <ul class="chipsel-menu">
        <li v-for="o in options" :key="o.value">
          <label><input type="checkbox" :checked="modelValue.includes(o.value)" @change="alternar(o.value)" /> {{ o.label }}</label>
        </li>
      </ul>
    </template>
  </div>
</template>
