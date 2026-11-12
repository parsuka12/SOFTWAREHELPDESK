<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';
import Icon from './Icon.vue';
import { api, mensajeError } from '../api/http';
import { useUiStore } from '../stores/ui';

const emit = defineEmits(['cerrar']);
const ui = useUiStore();
const form = ref({ para: '', asunto: '', mensaje: '', ticket_id: '' });
const error = ref('');
const enviando = ref(false);

async function enviar() {
  error.value = '';
  enviando.value = true;
  try {
    const body = { para: form.value.para, asunto: form.value.asunto, mensaje: form.value.mensaje };
    if (form.value.ticket_id) body.ticket_id = Number(form.value.ticket_id);
    const r = await api('/correos', { method: 'POST', body });
    ui.aviso(r.simulado ? 'Correo simulado: el servidor aún no tiene SMTP configurado' : 'Correo enviado');
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
  <Modal titulo="Nuevo correo" @cerrar="emit('cerrar')">
    <form @submit.prevent="enviar">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="campo">
        <label for="c-para">Para</label>
        <input id="c-para" v-model="form.para" class="input" type="email" required placeholder="persona@empresa.com" />
      </div>
      <div class="campo">
        <label for="c-asunto">Asunto</label>
        <input id="c-asunto" v-model="form.asunto" class="input" required maxlength="200" />
      </div>
      <div class="campo">
        <label for="c-msg">Mensaje</label>
        <textarea id="c-msg" v-model="form.mensaje" class="textarea" required maxlength="5000"></textarea>
      </div>
      <div class="campo">
        <label for="c-ticket">Número de ticket relacionado (opcional)</label>
        <input id="c-ticket" v-model="form.ticket_id" class="input" type="number" min="1" placeholder="Ej: 3" />
      </div>
      <div class="acciones">
        <button type="button" class="btn" @click="emit('cerrar')">Cancelar</button>
        <button class="btn btn-primario" :disabled="enviando"><Icon name="send" :size="18" /> {{ enviando ? 'Enviando…' : 'Enviar correo' }}</button>
      </div>
    </form>
  </Modal>
</template>
