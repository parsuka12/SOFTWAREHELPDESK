<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { mensajeError } from '../api/http';

const auth = useAuthStore();
const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const confirmar = ref('');
const error = ref('');
const cargando = ref(false);

async function registrar() {
  error.value = '';
  if (password.value !== confirmar.value) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }
  cargando.value = true;
  try {
    await auth.registro(name.value, email.value, password.value);
    router.push('/tickets');
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="auth">
    <form class="auth-card" @submit.prevent="registrar">
      <img src="/logo.svg" alt="" />
      <h1>Crear cuenta</h1>
      <p class="sub">Regístrate para enviar y seguir tus tickets</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="campo">
        <label for="name">Nombre</label>
        <input id="name" v-model="name" class="input" autocomplete="name" required minlength="2" />
      </div>
      <div class="campo">
        <label for="email">Correo</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="username" required />
      </div>
      <div class="campo">
        <label for="password">Contraseña (mínimo 8 caracteres)</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="new-password" required minlength="8" />
      </div>
      <div class="campo">
        <label for="confirmar">Confirmar contraseña</label>
        <input id="confirmar" v-model="confirmar" class="input" type="password" autocomplete="new-password" required />
      </div>
      <button class="btn btn-primario" :disabled="cargando">{{ cargando ? 'Creando…' : 'Crear cuenta' }}</button>
      <p class="auth-pie">¿Ya tienes cuenta? <RouterLink to="/login">Inicia sesión</RouterLink></p>
    </form>
  </div>
</template>
