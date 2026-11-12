<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Icon from './Icon.vue';
import AiPanel from './AiPanel.vue';
import { api } from '../api/http';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { ESTADOS, NIVELES, colorAvatar, fechaHora, inicial, tiempoRestante } from '../utils/format';

const props = defineProps({ id: { type: Number, required: true }, tabInicial: { type: String, default: 'detalle' } });
const emit = defineEmits(['cerrar']);

const auth = useAuthStore();
const ui = useUiStore();

const ticket = ref(null);
const comentarios = ref([]);
const tecnicos = ref([]);
const error = ref('');
const tab = ref(props.tabInicial === 'ia' && !auth.esStaff ? 'detalle' : props.tabInicial);
const nuevoComentario = ref('');
const resolviendo = ref(false);
const solucion = ref('');

const restante = computed(() => (ticket.value ? tiempoRestante(ticket.value.fecha_limite, ticket.value.estado) : null));
const enPapelera = computed(() => !!ticket.value?.eliminado_en);

async function cargar() {
  try {
    const [t, c] = await Promise.all([api(`/tickets/${props.id}`), api(`/tickets/${props.id}/comentarios`)]);
    ticket.value = t.ticket;
    comentarios.value = c.data;
    if (auth.esStaff && !tecnicos.value.length) tecnicos.value = (await api('/usuarios/tecnicos')).data;
  } catch (e) {
    error.value = e.message;
  }
}

async function ejecutar(fn, mensaje) {
  try {
    await fn();
    ui.refrescar();
    if (mensaje) ui.aviso(mensaje);
  } catch (e) {
    ui.aviso(e.message, 'error');
  }
}

const guardar = (campos) =>
  ejecutar(async () => {
    ticket.value = (await api(`/tickets/${props.id}`, { method: 'PATCH', body: campos })).ticket;
  }, 'Ticket actualizado');

const accion = (ruta, method = 'POST', mensaje) =>
  ejecutar(async () => {
    const r = await api(`/tickets/${props.id}${ruta}`, { method });
    if (r?.ticket) ticket.value = r.ticket;
  }, mensaje);

const alternarObservar = () =>
  ejecutar(async () => {
    const r = await api(`/tickets/${props.id}/observar`, { method: ticket.value.observando ? 'DELETE' : 'POST' });
    ticket.value.observando = r.observando;
  });

function cambiarEstado(e) {
  const valor = e.target.value;
  if (valor === 'resuelto') {
    e.target.value = ticket.value.estado; // se confirma con la solución
    resolviendo.value = true;
  } else guardar({ estado: valor });
}

const resolver = () =>
  ejecutar(async () => {
    ticket.value = (await api(`/tickets/${props.id}/resolver`, { method: 'POST', body: { solucion: solucion.value } })).ticket;
    resolviendo.value = false;
    solucion.value = '';
  }, 'Ticket resuelto');

const eliminarDefinitivo = () => {
  if (!confirm('¿Eliminar este ticket definitivamente? Esta acción no se puede deshacer.')) return;
  ejecutar(async () => {
    await api(`/tickets/${props.id}/permanente`, { method: 'DELETE' });
    emit('cerrar');
  }, 'Ticket eliminado');
};

const comentar = () =>
  ejecutar(async () => {
    const { comentario } = await api(`/tickets/${props.id}/comentarios`, { method: 'POST', body: { mensaje: nuevoComentario.value } });
    comentarios.value.push(comentario);
    nuevoComentario.value = '';
  });

// El botón "IA" de la barra superior cambia a esa pestaña si el ticket ya está abierto
watch(
  () => ui.detalle,
  (d) => {
    if (d?.id === props.id) tab.value = d.tab === 'ia' && !auth.esStaff ? 'detalle' : d.tab;
  },
);

const alTeclear = (e) => e.key === 'Escape' && emit('cerrar');
onMounted(() => {
  cargar();
  window.addEventListener('keydown', alTeclear);
});
onBeforeUnmount(() => window.removeEventListener('keydown', alTeclear));
</script>

<template>
  <div class="drawer-scrim" @click="emit('cerrar')"></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label="Detalle del ticket">
    <div class="drawer-head">
      <template v-if="ticket">
        <span class="avatar" :style="{ background: colorAvatar(ticket.creado_por_nombre) }">{{ inicial(ticket.creado_por_nombre) }}</span>
        <h2>{{ ticket.nombre }} <span class="muted" style="font-weight: 400">#{{ ticket.numero }}</span></h2>
        <button
          class="star icon-btn"
          :class="{ on: ticket.observando }"
          :aria-label="ticket.observando ? 'Dejar de observar' : 'Observar ticket'"
          @click="alternarObservar"
        >
          <Icon name="star" :size="24" />
        </button>
      </template>
      <h2 v-else>Ticket #{{ id }}</h2>
      <button class="icon-btn" aria-label="Cerrar" @click="emit('cerrar')"><Icon name="x" /></button>
    </div>

    <p v-if="error" class="error" style="margin: 16px">{{ error }}</p>

    <template v-if="ticket">
      <div class="tabs" role="tablist">
        <button class="tab" :class="{ activa: tab === 'detalle' }" role="tab" @click="tab = 'detalle'">Detalle</button>
        <button class="tab" :class="{ activa: tab === 'comentarios' }" role="tab" @click="tab = 'comentarios'">Comentarios ({{ comentarios.length }})</button>
        <button v-if="auth.esStaff" class="tab" :class="{ activa: tab === 'ia' }" role="tab" @click="tab = 'ia'">Asistente IA</button>
      </div>

      <div class="drawer-body">
        <!-- DETALLE -->
        <template v-if="tab === 'detalle'">
          <p class="desc">{{ ticket.descripcion }}</p>

          <dl class="info">
            <div><dt>Creado por</dt><dd>{{ ticket.creado_por_nombre }}</dd></div>
            <div><dt>Fecha de creación</dt><dd>{{ fechaHora(ticket.created_at) }}</dd></div>
            <div><dt>Equipo</dt><dd>{{ ticket.equipo || '—' }}</dd></div>
            <div><dt>Cuenta</dt><dd>{{ ticket.cuenta || '—' }}</dd></div>

            <div>
              <dt>Nivel</dt>
              <dd v-if="auth.esStaff">
                <i class="sq" :style="{ background: NIVELES[ticket.nivel].color }"></i>
                <select class="select" :value="ticket.nivel" aria-label="Nivel" :disabled="enPapelera" @change="guardar({ nivel: $event.target.value })">
                  <option v-for="(n, k) in NIVELES" :key="k" :value="k">{{ n.label }}</option>
                </select>
              </dd>
              <dd v-else><i class="sq" :style="{ background: NIVELES[ticket.nivel].color }"></i> {{ NIVELES[ticket.nivel].label }}</dd>
            </div>
            <div>
              <dt>Tiempo de respuesta</dt>
              <dd>{{ ticket.tiempo_respuesta }}</dd>
            </div>

            <div>
              <dt>Estado</dt>
              <dd v-if="auth.esStaff">
                <select class="select" :value="ticket.estado" aria-label="Estado" :disabled="enPapelera" @change="cambiarEstado">
                  <option v-for="(label, k) in ESTADOS" :key="k" :value="k">{{ label }}</option>
                </select>
              </dd>
              <dd v-else>{{ ESTADOS[ticket.estado] }}</dd>
            </div>
            <div>
              <dt>Asignado a</dt>
              <dd v-if="auth.esStaff">
                <select
                  class="select"
                  :value="ticket.asignado_a ?? ''"
                  aria-label="Asignado a"
                  :disabled="enPapelera"
                  @change="guardar({ asignado_a: $event.target.value ? Number($event.target.value) : null })"
                >
                  <option value="">Sin asignar</option>
                  <option v-for="t in tecnicos" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </dd>
              <dd v-else>{{ ticket.asignado_a_nombre || 'Sin asignar' }}</dd>
            </div>

            <div style="grid-column: 1 / -1">
              <dt>Fecha límite</dt>
              <dd>
                {{ fechaHora(ticket.fecha_limite) }}
                <span v-if="restante" class="pill" :class="{ rojo: restante.vencido, warn: restante.urgente }">{{ restante.texto }}</span>
              </dd>
            </div>
          </dl>

          <div v-if="ticket.solucion" class="bloque">
            <h3>Solución aplicada</h3>
            <p class="desc">{{ ticket.solucion }}</p>
          </div>

          <div v-if="resolviendo" class="bloque">
            <h3>Describe cómo se resolvió</h3>
            <p class="muted" style="margin-bottom: 8px">Esta solución alimenta el historial que usa el asistente de IA.</p>
            <textarea v-model="solucion" class="textarea" minlength="3" placeholder="Ej: Se reemplazó la pasta térmica y se limpió el disipador."></textarea>
            <div class="acciones">
              <button class="btn" @click="resolviendo = false">Cancelar</button>
              <button class="btn btn-primario" :disabled="solucion.trim().length < 3" @click="resolver">Marcar como resuelto</button>
            </div>
          </div>

          <div v-if="auth.esStaff" class="acciones-izq">
            <button v-if="!enPapelera && !['resuelto', 'cerrado'].includes(ticket.estado)" class="btn btn-primario" @click="resolviendo = true">Resolver</button>
            <template v-if="!enPapelera">
              <button v-if="!ticket.archivado" class="btn" @click="accion('/archivar', 'POST', 'Ticket archivado')"><Icon name="archive" :size="18" /> Archivar</button>
              <button v-else class="btn" @click="accion('/desarchivar', 'POST', 'Ticket desarchivado')">Desarchivar</button>
              <button class="btn btn-peligro" @click="accion('', 'DELETE', 'Enviado a la papelera')"><Icon name="trash" :size="18" /> A la papelera</button>
            </template>
            <template v-else>
              <button class="btn" @click="accion('/restaurar', 'POST', 'Ticket restaurado')">Restaurar</button>
              <button v-if="auth.esAdmin" class="btn btn-peligro" @click="eliminarDefinitivo">Eliminar definitivamente</button>
            </template>
          </div>
        </template>

        <!-- COMENTARIOS -->
        <template v-else-if="tab === 'comentarios'">
          <p v-if="!comentarios.length" class="vacio">Todavía no hay comentarios.</p>
          <div v-for="c in comentarios" :key="c.id" class="comentario">
            <header>
              <span class="avatar" :style="{ background: colorAvatar(c.autor), width: '26px', height: '26px', fontSize: '12px' }">{{ inicial(c.autor) }}</span>
              <strong>{{ c.autor }}</strong>
              <span class="muted">{{ fechaHora(c.created_at) }}</span>
            </header>
            <p>{{ c.mensaje }}</p>
          </div>
          <form v-if="!enPapelera" style="margin-top: 14px" @submit.prevent="comentar">
            <textarea v-model="nuevoComentario" class="textarea" required maxlength="3000" placeholder="Escribe un comentario…" aria-label="Nuevo comentario"></textarea>
            <div class="acciones"><button class="btn btn-primario" :disabled="!nuevoComentario.trim()"><Icon name="send" :size="18" /> Comentar</button></div>
          </form>
        </template>

        <!-- IA -->
        <AiPanel v-else-if="tab === 'ia'" :ticket="ticket" @aplicar-nivel="(n) => guardar({ nivel: n })" />
      </div>
    </template>
  </aside>
</template>
