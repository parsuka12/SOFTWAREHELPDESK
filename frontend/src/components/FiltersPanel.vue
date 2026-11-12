<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import Icon from './Icon.vue';
import ChipSelect from './ChipSelect.vue';
import { api } from '../api/http';
import { useAuthStore } from '../stores/auth';
import { ESTADO_OPCIONES, NIVEL_OPCIONES } from '../utils/format';
import { VACIO, defaultFiltros } from '../utils/filtros';

const props = defineProps({ aplicado: { type: Object, required: true }, vista: { type: String, required: true } });
const emit = defineEmits(['aplicar']);

const auth = useAuthStore();
const clonar = (o) => JSON.parse(JSON.stringify(o));
const borrador = ref(clonar(props.aplicado));
watch(() => props.aplicado, (v) => (borrador.value = clonar(v)), { deep: true });

const tecnicos = ref([]);
onMounted(async () => {
  if (!auth.esStaff) return;
  try {
    tecnicos.value = (await api('/usuarios/tecnicos')).data;
  } catch {
    /* el filtro "Asignado a" queda sin opciones */
  }
});

const DEFINICIONES = computed(() =>
  [
    { key: 'estado', label: 'Estado incluir' },
    { key: 'nivel', label: 'Nivel incluir' },
    { key: 'equipo', label: 'Equipo contiene' },
    { key: 'cuenta', label: 'Cuenta contiene' },
    auth.esStaff && { key: 'asignado_a', label: 'Asignado a' },
    { key: 'fechas', label: 'Fecha de creación' },
    { key: 'vencidos', label: 'Tiempo de respuesta' },
  ].filter(Boolean),
);
const activas = computed(() => DEFINICIONES.value.filter((d) => borrador.value.activos.includes(d.key)));
const disponibles = computed(() => DEFINICIONES.value.filter((d) => !borrador.value.activos.includes(d.key)));

const menuAnadir = ref(false);
const anadir = (key) => {
  borrador.value.activos.push(key);
  menuAnadir.value = false;
};
const mostrarTodos = () => (borrador.value.activos = DEFINICIONES.value.map((d) => d.key));
const quitar = (key) => {
  borrador.value.activos = borrador.value.activos.filter((k) => k !== key);
  if (key === 'fechas') Object.assign(borrador.value, { desde: '', hasta: '' });
  else borrador.value[key] = clonar(VACIO)[key];
};

const cambio = computed(() => JSON.stringify(borrador.value) !== JSON.stringify(props.aplicado));
const esDefault = computed(() => JSON.stringify(borrador.value) === JSON.stringify(defaultFiltros(props.vista)));
const aplicar = () => emit('aplicar', clonar(borrador.value));
const reestablecer = () => emit('aplicar', defaultFiltros(props.vista));
</script>

<template>
  <div class="filtros-contenido" style="display: flex; flex-direction: column; min-height: 0; flex: 1">
    <div class="fp-head">
      <h2>Filtros</h2>
      <button class="link" @click="mostrarTodos">Mostrar todos los filtros</button>
    </div>

    <div class="fp-body">
      <input
        v-model="borrador.q"
        class="input"
        type="search"
        placeholder="Buscar por nombre, descripción o #"
        aria-label="Buscar tickets"
        @keyup.enter="aplicar"
      />

      <div v-for="f in activas" :key="f.key" class="filtro">
        <span class="filtro-label">{{ f.label }} ▾</span>
        <div class="filtro-fila">
          <div>
            <ChipSelect v-if="f.key === 'estado'" v-model="borrador.estado" :options="ESTADO_OPCIONES" />
            <ChipSelect v-else-if="f.key === 'nivel'" v-model="borrador.nivel" :options="NIVEL_OPCIONES" />
            <input v-else-if="f.key === 'equipo'" v-model="borrador.equipo" class="input" placeholder="Ej: pc-05" />
            <input v-else-if="f.key === 'cuenta'" v-model="borrador.cuenta" class="input" placeholder="Ej: restel" />
            <select v-else-if="f.key === 'asignado_a'" v-model="borrador.asignado_a" class="select">
              <option value="">Cualquiera</option>
              <option value="sin_asignar">Sin asignar</option>
              <option v-for="t in tecnicos" :key="t.id" :value="String(t.id)">{{ t.name }}</option>
            </select>
            <div v-else-if="f.key === 'fechas'" style="display: grid; gap: 8px">
              <input v-model="borrador.desde" class="input" type="date" aria-label="Desde" />
              <input v-model="borrador.hasta" class="input" type="date" aria-label="Hasta" />
            </div>
            <label v-else-if="f.key === 'vencidos'" style="display: flex; gap: 8px; align-items: center">
              <input v-model="borrador.vencidos" type="checkbox" /> Solo vencidos
            </label>
          </div>
          <button class="quitar" :aria-label="`Quitar filtro ${f.label}`" @click="quitar(f.key)">
            <Icon name="minus-circle" :size="26" />
          </button>
        </div>
      </div>

      <div v-if="disponibles.length" class="rel">
        <button class="anadir" @click="menuAnadir = !menuAnadir">
          <Icon name="plus-circle" :size="28" style="color: var(--acento)" /> Añadir filtros
        </button>
        <template v-if="menuAnadir">
          <div class="backdrop" @click="menuAnadir = false"></div>
          <div class="menu" style="left: 0; right: auto">
            <button v-for="d in disponibles" :key="d.key" @click="anadir(d.key)">{{ d.label.replace(' incluir', '').replace(' contiene', '') }}</button>
          </div>
        </template>
      </div>
    </div>

    <div class="fp-pie">
      <button class="btn" :disabled="esDefault && !cambio" @click="reestablecer">Reestablecer</button>
      <button class="btn btn-aplicar" :disabled="!cambio" @click="aplicar">Aplicar</button>
    </div>
  </div>
</template>
