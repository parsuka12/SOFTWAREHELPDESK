<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import Icon from '../components/Icon.vue';
import NotificationsMenu from '../components/NotificationsMenu.vue';
import TicketDetail from '../components/TicketDetail.vue';
import NuevoTicketModal from '../components/NuevoTicketModal.vue';
import NuevoCorreoModal from '../components/NuevoCorreoModal.vue';
import AyudaModal from '../components/AyudaModal.vue';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { inicial } from '../utils/format';

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();

const menuNuevo = ref(false);
const menuUsuario = ref(false);

const enTickets = computed(() => route.name === 'tickets');
const titulo = computed(() => (enTickets.value ? ui.tituloVista : route.meta.titulo || 'Mesa de ayuda'));

onMounted(() => {
  // Refresca el rol por si un administrador lo cambió
  auth.cargarPerfil().catch(() => {});
});

function abrirIA() {
  if (!ui.detalle) {
    ui.aviso('Primero abre un ticket para consultar al asistente de IA');
    if (!enTickets.value) router.push({ name: 'tickets' });
    return;
  }
  ui.abrirDetalle(ui.detalle.id, 'ia');
}
function nuevo(tipo) {
  menuNuevo.value = false;
  if (tipo === 'ticket') ui.modalTicket = true;
  else ui.modalCorreo = true;
}
function salir() {
  menuUsuario.value = false;
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="app">
    <nav class="rail" aria-label="Navegación principal">
      <img class="logo" src="/logo.svg" alt="Mesa de ayuda" />
      <RouterLink v-if="auth.esStaff" to="/actividad" aria-label="Actividad reciente" title="Actividad reciente"><Icon name="history" :size="28" /></RouterLink>
      <RouterLink to="/tickets" aria-label="Tickets" title="Tickets"><Icon name="ticket" :size="28" /></RouterLink>
      <RouterLink :to="auth.esAdmin ? '/usuarios' : '/ajustes'" :aria-label="auth.esAdmin ? 'Usuarios' : 'Mi perfil'" :title="auth.esAdmin ? 'Usuarios' : 'Mi perfil'">
        <Icon name="user" :size="28" />
      </RouterLink>
      <RouterLink v-if="auth.esStaff" to="/dashboard" aria-label="Dashboard" title="Dashboard"><Icon name="chart" :size="28" /></RouterLink>
      <RouterLink v-if="auth.esAdmin" to="/ajustes" aria-label="Configuración" title="Configuración"><Icon name="settings" :size="28" /></RouterLink>
    </nav>

    <div class="main">
      <header class="topbar">
        <button v-if="enTickets" class="icon-btn solo-movil" aria-label="Mostrar vistas" @click="ui.panelVistas = !ui.panelVistas"><Icon name="menu" :size="28" /></button>
        <button v-if="enTickets" class="icon-btn" aria-label="Mostrar u ocultar filtros" @click="ui.panelFiltros = !ui.panelFiltros"><Icon name="filter" :size="30" /></button>
        <h1 class="top-titulo">{{ titulo }}</h1>
        <span v-if="enTickets && ui.totalVista !== null" class="badge-count" :aria-label="`${ui.totalVista} tickets`">{{ ui.totalVista }}</span>

        <span class="spacer"></span>

        <button v-if="auth.esStaff" class="btn-ia" aria-label="Asistente de IA" title="Asistente de IA (Gemini)" @click="abrirIA">IA</button>

        <div class="rel">
          <button class="btn-nuevo" aria-haspopup="menu" :aria-expanded="menuNuevo" @click="menuNuevo = !menuNuevo">
            <Icon name="plus-square" :size="26" /> <span>Nuevo</span> <Icon name="chevron-down" :size="20" />
          </button>
          <template v-if="menuNuevo">
            <div class="backdrop" @click="menuNuevo = false"></div>
            <div class="menu" role="menu">
              <button role="menuitem" @click="nuevo('ticket')"><Icon name="ticket" :size="20" /> Nuevo ticket</button>
              <button v-if="auth.esStaff" role="menuitem" @click="nuevo('correo')"><Icon name="mail" :size="20" /> Nuevo correo</button>
            </div>
          </template>
        </div>

        <NotificationsMenu />

        <button class="icon-btn ayuda-btn" aria-label="Ayuda" @click="ui.ayuda = true"><Icon name="help" :size="30" /></button>

        <div class="rel">
          <button class="avatar top" :aria-label="`Cuenta de ${auth.user?.name}`" @click="menuUsuario = !menuUsuario">{{ inicial(auth.user?.name) }}</button>
          <template v-if="menuUsuario">
            <div class="backdrop" @click="menuUsuario = false"></div>
            <div class="menu">
              <p style="padding: 8px 12px; border-bottom: 1px solid var(--linea); margin-bottom: 4px">
                <strong>{{ auth.user?.name }}</strong><br /><span class="muted" style="font-size: 13px">{{ auth.user?.email }}</span>
              </p>
              <button @click="menuUsuario = false; router.push('/ajustes')"><Icon name="settings" :size="20" /> Mi cuenta</button>
              <button @click="salir"><Icon name="logout" :size="20" /> Cerrar sesión</button>
            </div>
          </template>
        </div>
      </header>

      <main class="content"><RouterView /></main>
    </div>

    <TicketDetail v-if="ui.detalle" :key="ui.detalle.id" :id="ui.detalle.id" :tab-inicial="ui.detalle.tab" @cerrar="ui.cerrarDetalle()" />
    <NuevoTicketModal v-if="ui.modalTicket" @cerrar="ui.modalTicket = false" />
    <NuevoCorreoModal v-if="ui.modalCorreo" @cerrar="ui.modalCorreo = false" />
    <AyudaModal v-if="ui.ayuda" @cerrar="ui.ayuda = false" />
  </div>
</template>
