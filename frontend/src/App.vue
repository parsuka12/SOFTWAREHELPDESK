<script setup>
import { RouterView } from 'vue-router';
import { useUiStore } from './stores/ui';

const ui = useUiStore();
</script>

<template>
  <RouterView />
  <div v-if="ui.toast" class="toast" :class="{ error: ui.toast.tipo === 'error' }" role="status">{{ ui.toast.msg }}</div>
</template>
