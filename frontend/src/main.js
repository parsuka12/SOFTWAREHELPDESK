import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './styles/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// El cliente HTTP emite este evento cuando el token vence o es inválido
window.addEventListener('auth:logout', () => {
  useAuthStore().logout();
  router.push({ name: 'login' });
});

app.mount('#app');
