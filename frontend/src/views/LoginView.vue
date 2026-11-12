<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { mensajeError } from '../api/http';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const error = ref('');
const cargando = ref(false);

async function entrar() {
  error.value = '';
  cargando.value = true;
  try {
    await auth.login(email.value, password.value);
    const destino = route.query.redirect;
    router.push(typeof destino === 'string' && destino.startsWith('/') ? destino : '/tickets');
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="auth">
    <form class="auth-card" @submit.prevent="entrar">
      <img src="/logo.svg" alt="" />
      <h1>Mesa de ayuda</h1>
      <p class="sub">Inicia sesión para ver tus tickets</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="campo">
        <label for="email">Correo</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="username" required />
      </div>
      <div class="campo">
        <label for="password">Contraseña</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required />
      </div>
      <button class="btn btn-primario" :disabled="cargando">{{ cargando ? 'Entrando…' : 'Iniciar sesión' }}</button>
      <p class="auth-pie">¿No tienes cuenta? <RouterLink to="/registro">Regístrate</RouterLink></p>
    </form>
  </div>
</template>
