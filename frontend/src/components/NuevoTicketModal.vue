<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';
import { api, mensajeError } from '../api/http';
import { useUiStore } from '../stores/ui';
import { NIVELES } from '../utils/format';

const emit = defineEmits(['cerrar']);
const ui = useUiStore();
const form = ref({ nombre: '', descripcion: '', nivel: 'bajo', equipo: '', cuenta: '' });
const error = ref('');
const enviando = ref(false);

async function crear() {
  error.value = '';
  enviando.value = true;
  try {
    const { ticket } = await api('/tickets', { method: 'POST', body: form.value });
    ui.aviso(`Ticket #${ticket.numero} creado`);
    ui.refrescar();
    emit('cerrar');
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <Modal titulo="Nuevo ticket" @cerrar="emit('cerrar')">
    <form @submit.prevent="crear">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="campo">
        <label for="t-nombre">Nombre del ticket</label>
        <input id="t-nombre" v-model="form.nombre" class="input" required minlength="3" maxlength="200" placeholder="Ej: Falla de internet" />
      </div>
      <div class="campo">
        <label for="t-desc">Descripción breve</label>
        <textarea id="t-desc" v-model="form.descripcion" class="textarea" required minlength="5" maxlength="5000" placeholder="¿Qué está pasando?"></textarea>
      </div>
      <div class="campo">
        <span class="etiqueta">Nivel del ticket</span>
        <div class="niveles">
          <button
            v-for="(n, clave) in NIVELES"
            :key="clave"
            type="button"
            class="nivel-op"
            :class="{ sel: form.nivel === clave }"
            :aria-pressed="form.nivel === clave"
            @click="form.nivel = clave"
          >
            <i class="sq" :style="{ background: n.color }"></i>
            <strong>{{ n.label }}</strong>
            <small>Respuesta en {{ n.horas }}h</small>
          </button>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
        <div class="campo">
          <label for="t-equipo">Equipo</label>
          <input id="t-equipo" v-model="form.equipo" class="input" maxlength="120" placeholder="Ej: pc-05" />
        </div>
        <div class="campo">
          <label for="t-cuenta">Cuenta</label>
          <input id="t-cuenta" v-model="form.cuenta" class="input" maxlength="120" placeholder="Ej: restel" />
        </div>
      </div>
      <div class="acciones">
        <button type="button" class="btn" @click="emit('cerrar')">Cancelar</button>
        <button class="btn btn-primario" :disabled="enviando">{{ enviando ? 'Creando…' : 'Crear ticket' }}</button>
      </div>
    </form>
  </Modal>
</template>
