<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({ config: { type: Object, required: true } });
const lienzo = ref(null);
let grafica = null;

const dibujar = () => {
  grafica?.destroy();
  if (lienzo.value) grafica = new Chart(lienzo.value, JSON.parse(JSON.stringify(props.config)));
};

onMounted(dibujar);
watch(() => props.config, dibujar, { deep: true });
onBeforeUnmount(() => grafica?.destroy());
</script>

<template>
  <div class="grafica-lienzo"><canvas ref="lienzo"></canvas></div>
</template>
