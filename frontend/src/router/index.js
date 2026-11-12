import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { invitado: true } },
  { path: '/registro', name: 'registro', component: () => import('../views/RegisterView.vue'), meta: { invitado: true } },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: '/tickets' },
      { path: 'tickets', name: 'tickets', component: () => import('../views/TicketsView.vue'), meta: { titulo: 'Tickets' } },
      { path: 'actividad', name: 'actividad', component: () => import('../views/ActividadView.vue'), meta: { titulo: 'Actividad reciente', staff: true } },
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { titulo: 'Dashboard de métricas', staff: true } },
      { path: 'usuarios', name: 'usuarios', component: () => import('../views/UsuariosView.vue'), meta: { titulo: 'Usuarios', admin: true } },
      { path: 'ajustes', name: 'ajustes', component: () => import('../views/AjustesView.vue'), meta: { titulo: 'Configuración' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/tickets' },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.auth && !auth.logueado) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.invitado && auth.logueado) return { name: 'tickets' };
  if (to.meta.staff && !auth.esStaff) return { name: 'tickets' };
  if (to.meta.admin && !auth.esAdmin) return { name: 'tickets' };
});

export default router;
