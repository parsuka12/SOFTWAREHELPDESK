<script setup>
import { useRouter } from 'vue-router';
import Icon from '../components/Icon.vue';
import { useAuthStore } from '../stores/auth';
import { NIVELES, ROLES, colorAvatar, inicial } from '../utils/format';

const auth = useAuthStore();
const router = useRouter();
function salir() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="pagina" style="max-width: 720px">
    <div class="pagina-head"><h1>Mi cuenta</h1></div>

    <section class="bloque" style="display: flex; align-items: center; gap: 14px; margin-top: 0">
      <span class="avatar" :style="{ background: colorAvatar(auth.user?.name), width: '52px', height: '52px', fontSize: '22px' }">{{ inicial(auth.user?.name) }}</span>
      <div style="flex: 1; min-width: 0">
        <strong>{{ auth.user?.name }}</strong><br />
        <span class="muted">{{ auth.user?.email }} · {{ ROLES[auth.user?.role] }}</span>
      </div>
      <button class="btn" @click="salir"><Icon name="logout" :size="18" /> Cerrar sesión</button>
    </section>

    <section class="bloque">
      <h3>Niveles de los tickets</h3>
      <p class="muted" style="margin-bottom: 10px">El tiempo de respuesta es el plazo que tiene el técnico para responder o resolver, y depende del nivel.</p>
      <ul style="display: grid; gap: 8px">
        <li v-for="(n, k) in NIVELES" :key="k" style="display: flex; align-items: center; gap: 10px">
          <i class="sq" :style="{ background: n.color }"></i> <strong>{{ n.label }}</strong> — {{ n.horas }} horas
        </li>
      </ul>
    </section>
  </div>
</template>
