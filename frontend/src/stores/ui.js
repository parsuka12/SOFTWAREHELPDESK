import { defineStore } from 'pinia';

let temporizador;

export const useUiStore = defineStore('ui', {
  state: () => ({
    detalle: null, // { id, tab }
    refresh: 0, // se incrementa para recargar listas
    toast: null,
    modalTicket: false,
    modalCorreo: false,
    ayuda: false,
    panelFiltros: window.innerWidth > 1100,
    panelVistas: window.innerWidth > 760,
    tituloVista: 'Tickets',
    totalVista: null,
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
  },
});
