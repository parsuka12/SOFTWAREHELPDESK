<script setup>
import { onMounted, ref } from 'vue';
import Modal from '../components/Modal.vue';
import { api, mensajeError } from '../api/http';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { ROLES } from '../utils/format';

const auth = useAuthStore();
const ui = useUiStore();
const usuarios = ref([]);
const error = ref('');
const modal = ref(false);
const form = ref({ name: '', email: '', password: '', role: 'tecnico' });
const errorForm = ref('');

async function cargar() {
  try {
    usuarios.value = (await api('/usuarios')).data;
  } catch (e) {
    error.value = e.message;
  }
}
async function cambiar(u, campos) {
  try {
    Object.assign(u, (await api(`/usuarios/${u.id}`, { method: 'PATCH', body: campos })).user);
    ui.aviso('Usuario actualizado');
  } catch (e) {
    ui.aviso(e.message, 'error');
    cargar();
  }
}
async function crear() {
  errorForm.value = '';
  try {
    await api('/usuarios', { method: 'POST', body: form.value });
    modal.value = false;
    form.value = { name: '', email: '', password: '', role: 'tecnico' };
    ui.aviso('Usuario creado');
    cargar();
  } catch (e) {
    errorForm.value = mensajeError(e);
  }
}
onMounted(cargar);
</script>

<template>
  <div class="pagina">
    <div class="pagina-head">
      <h1>Usuarios</h1>
      <button class="btn btn-primario" @click="modal = true">Nuevo usuario</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="tabla-wrap">
      <table class="tabla">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>
              <select class="select" :value="u.role" :disabled="u.id === auth.user.id" :aria-label="`Rol de ${u.name}`" @change="cambiar(u, { role: $event.target.value })">
                <option v-for="(label, k) in ROLES" :key="k" :value="k">{{ label }}</option>
              </select>
            </td>
            <td>
              <button class="btn btn-chico" :disabled="u.id === auth.user.id" @click="cambiar(u, { active: !u.active })">{{ u.active ? 'Activo' : 'Inactivo' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="modal" titulo="Nuevo usuario" @cerrar="modal = false">
      <form @submit.prevent="crear">
        <p v-if="errorForm" class="error" role="alert">{{ errorForm }}</p>
        <div class="campo"><label for="u-nombre">Nombre</label><input id="u-nombre" v-model="form.name" class="input" required minlength="2" /></div>
        <div class="campo"><label for="u-email">Correo</label><input id="u-email" v-model="form.email" class="input" type="email" required /></div>
        <div class="campo"><label for="u-pass">Contraseña (mínimo 8 caracteres)</label><input id="u-pass" v-model="form.password" class="input" type="password" required minlength="8" /></div>
        <div class="campo">
          <label for="u-rol">Rol</label>
          <select id="u-rol" v-model="form.role" class="select"><option v-for="(label, k) in ROLES" :key="k" :value="k">{{ label }}</option></select>
        </div>
        <div class="acciones"><button type="button" class="btn" @click="modal = false">Cancelar</button><button class="btn btn-primario">Crear usuario</button></div>
      </form>
    </Modal>
  </div>
</template>
