import { defineStore } from 'pinia';

let temporizador;

export const useUiStore = defineStore('ui', {
  state: () => ({
    detalle: null,
    refresh: 0,
    toast: null,
    modalTicket: false,
    modalCorreo: false,
    ayuda: false,
    panelFiltros: window.innerWidth > 1100,
    panelVistas: window.innerWidth > 760,
    tituloVista: 'Tickets',
    totalVista: null,
    isDark: localStorage.getItem('theme') === 'dark',
  }),
  actions: {
    abrirDetalle(id, tab = 'detalle') {
      this.detalle = { id, tab };
    },
    cerrarDetalle() {
      this.detalle = null;
    },
    refrescar() {
      this.refresh++;
    },
    aviso(msg, tipo = 'ok') {
      this.toast = { msg, tipo };
      clearTimeout(temporizador);
      temporizador = setTimeout(() => (this.toast = null), 3500);
    },
    toggleDarkMode() {
      this.isDark = !this.isDark;
      if (this.isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    },
    initTema() {
      if (this.isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  },
});