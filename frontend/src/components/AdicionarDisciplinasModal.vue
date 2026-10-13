<template>
  <BModal v-model="aberto" title="Adicionar disciplinas ao semestre" size="xl" hide-footer scrollable>
    <BRow class="g-2 mb-2">
      <BCol md="5">
        <BFormSelect v-model="filtro.cursoId" :options="opcoesCurso" size="sm" aria-label="Curso" />
      </BCol>
      <BCol md="3">
        <BFormSelect v-model="filtro.periodo" :options="opcoesPeriodo" size="sm" aria-label="Período" />
      </BCol>
      <BCol md="4">
        <BFormInput v-model="filtro.busca" size="sm" placeholder="Buscar disciplina…" />
      </BCol>
    </BRow>

    <div class="d-flex justify-content-between align-items-center small mb-1">
      <BFormCheckbox :model-value="todasMarcadas" @update:model-value="marcarTodas">
        Marcar todas do filtro ({{ disciplinasFiltradas.length }})
      </BFormCheckbox>
      <span class="text-muted">{{ selecionadas.length }} selecionada(s)</span>
    </div>

    <div class="catalogo-lista border rounded">
      <table class="table table-sm table-hover mb-0">
        <tbody>
          <tr v-for="d in disciplinasFiltradas" :key="d.id">
            <td style="width: 2rem">
              <input v-model="selecionadas" class="form-check-input" type="checkbox" :value="d.id" :aria-label="d.nome" />
            </td>
            <td>
              {{ d.nome }}
              <div class="small text-muted">
                {{ rotuloCurso(cursoById(d.cursoId)) }} · {{ rotuloPeriodo(d) }}
                <BBadge v-if="d.tipo === 'orientacao'" variant="secondary" class="ms-1">TCC/Extensão</BBadge>
                <BBadge v-if="vezesOfertada(d.id)" variant="info" class="ms-1">
                  já ofertada{{ vezesOfertada(d.id) > 1 ? ` ×${vezesOfertada(d.id)}` : '' }}
                </BBadge>
              </div>
            </td>
            <td class="num small">{{ fmt(d.aulasSemanais) }} aulas</td>
          </tr>
          <tr v-if="!disciplinasFiltradas.length">
            <td colspan="3" class="text-center text-muted py-3">Nenhuma disciplina neste filtro.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex gap-2 mt-3 align-items-center">
      <BFormInput v-model="turma" list="turmas-existentes" placeholder="Turma (ex.: ADS 2026.1, TDS 2º ano)" />
      <datalist id="turmas-existentes">
        <option v-for="t in turmasExistentes" :key="t" :value="t" />
      </datalist>
      <BButton variant="primary" :disabled="!selecionadas.length" class="text-nowrap" @click="ofertar">
        Adicionar ({{ selecionadas.length }})
      </BButton>
    </div>
    <p class="small text-muted mt-2 mb-0">
      As disciplinas são agrupadas pela turma na planilha. Use o mesmo nome para disciplinas da mesma turma.
    </p>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { BModal, BRow, BCol, BFormSelect, BFormInput, BFormCheckbox, BButton, BBadge } from 'bootstrap-vue-next'
import { state, acoes, cursoById, rotuloCurso, rotuloPeriodo, ofertasDoSemestre, fmt } from '../stores/alocacao.js'
import { useNotify } from '../composables/useNotify.js'

// Janela com o catálogo de disciplinas para incluir no semestre selecionado
const aberto = defineModel({ type: Boolean, default: false })
defineProps({ turmasExistentes: { type: Array, default: () => [] } })

const { executar } = useNotify()
const ordemCurso = id => state.cursos.findIndex(c => c.id === id)

const filtro = reactive({ cursoId: 'ads2025', periodo: 'todos', busca: '' })
const selecionadas = ref([])
const turma = ref('')

const opcoesCurso = computed(() => [
  { value: 'todos', text: 'Todos os cursos' },
  ...state.cursos.map(c => ({ value: c.id, text: rotuloCurso(c) }))
])

const opcoesPeriodo = computed(() => {
  const curso = cursoById(filtro.cursoId)
  const sufixo = curso?.regime === 'anual' ? 'º ano' : 'º período'
  const periodos = [...new Set(
    state.disciplinas
      .filter(d => filtro.cursoId === 'todos' || d.cursoId === filtro.cursoId)
      .map(d => d.periodo)
      .filter(p => p != null)
  )].sort((a, b) => a - b)
  return [
    { value: 'todos', text: 'Todos os períodos' },
    ...periodos.map(p => ({ value: p, text: `${p}${curso ? sufixo : 'º'}` })),
    { value: 'optativa', text: 'Optativas' }
  ]
})

watch(() => filtro.cursoId, () => { filtro.periodo = 'todos' })

const normalizar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const disciplinasFiltradas = computed(() => {
  const busca = normalizar(filtro.busca.trim())
  return state.disciplinas
    .filter(d => filtro.cursoId === 'todos' || d.cursoId === filtro.cursoId)
    .filter(d => {
      if (filtro.periodo === 'todos') return true
      if (filtro.periodo === 'optativa') return d.periodo == null
      return d.periodo === filtro.periodo
    })
    .filter(d => !busca || normalizar(d.nome).includes(busca))
    .sort((a, b) => ordemCurso(a.cursoId) - ordemCurso(b.cursoId) || (a.periodo ?? 99) - (b.periodo ?? 99) || a.nome.localeCompare(b.nome))
})

const todasMarcadas = computed(() =>
  disciplinasFiltradas.value.length > 0 && disciplinasFiltradas.value.every(d => selecionadas.value.includes(d.id))
)

function marcarTodas (marcarTudo) {
  const ids = disciplinasFiltradas.value.map(d => d.id)
  selecionadas.value = marcarTudo
    ? [...new Set([...selecionadas.value, ...ids])]
    : selecionadas.value.filter(id => !ids.includes(id))
}

const vezesOfertada = id => ofertasDoSemestre.value.filter(o => o.disciplinaId === id).length

async function ofertar () {
  const n = selecionadas.value.length
  const ok = await executar(
    () => acoes.ofertar(selecionadas.value, turma.value.trim()),
    `${n} disciplina(s) adicionada(s)${turma.value.trim() ? ` à turma ${turma.value.trim()}` : ''}.`
  )
  if (ok) selecionadas.value = []
}
</script>
