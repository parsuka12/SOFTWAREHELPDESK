import { defineStore } from 'pinia';
import { api } from '../api/http';

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: localStorage.getItem('token') || '', user: leerUsuario() }),
  getters: {
    logueado: (s) => !!s.token,
    esStaff: (s) => ['tecnico', 'admin'].includes(s.user?.role),
    esAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    guardar({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    async login(email, password) {
      this.guardar(await api('/auth/login', { method: 'POST', body: { email, password } }));
    },
    async registro(name, email, password) {
      this.guardar(await api('/auth/registro', { method: 'POST', body: { name, email, password } }));
    },
    async cargarPerfil() {
      const { user } = await api('/auth/me');
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
