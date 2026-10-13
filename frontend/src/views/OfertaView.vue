<template>
  <div>
    <!-- Indicadores + ações -->
    <BRow class="g-2 mb-3 align-items-stretch">
      <BCol v-for="ind in indicadores" :key="ind.rotulo" cols="6" md>
        <BCard body-class="py-2" class="h-100">
          <div class="small text-muted">{{ ind.rotulo }}</div>
          <div class="fs-4 fw-semibold" :class="ind.classe">{{ ind.valor }}</div>
        </BCard>
      </BCol>
      <BCol cols="12" md="auto" class="d-flex flex-column gap-2 justify-content-center">
        <BButton variant="primary" @click="modalCatalogo = true">+ Adicionar disciplinas</BButton>
        <BButton size="sm" variant="outline-secondary" :disabled="!ofertasDoSemestre.length" @click="exportarCsv">
          Exportar CSV
        </BButton>
      </BCol>
    </BRow>

    <div v-if="!ofertasDoSemestre.length" class="alert alert-light border">
      Nenhuma disciplina ofertada em {{ state.semestreAtual }}. Clique em <strong>+ Adicionar disciplinas</strong>.
    </div>

    <!-- Planilha: disciplinas (linhas) × professores (colunas), agrupadas por turma -->
    <div v-else class="table-responsive border rounded bg-white">
      <table class="table table-sm table-bordered mb-0 planilha">
        <thead class="table-light">
          <tr>
            <th class="col-disc">Disciplina</th>
            <th style="width: 7.5rem">Turma</th>
            <th style="width: 4.5rem" class="text-center">Aulas</th>
            <th v-for="p in professores" :key="p.id" class="col-prof" :title="p.nome">
              <div class="cab-prof">{{ nomeCurto(p.nome) }}</div>
              <BBadge :variant="situacao(cargaDe(p.id), p).variant" class="mt-1">
                {{ fmt(cargaDe(p.id)) }}/{{ p.maxAulas }}
              </BBadge>
            </th>
            <th style="width: 2.5rem"></th>
          </tr>
        </thead>

        <tbody v-for="grupo in grupos" :key="grupo.turma">
          <tr class="table-secondary">
            <td :colspan="4 + professores.length">
              <strong>{{ grupo.turma || 'Sem turma definida' }}</strong>
              <span class="small ms-2">
                {{ grupo.ofertas.length }} disciplina(s) · {{ fmt(grupo.total) }} aulas/semana
                <span v-if="grupo.semProf" class="text-danger ms-1">· {{ grupo.semProf }} sem professor</span>
              </span>
            </td>
          </tr>
          <tr v-for="o in grupo.ofertas" :key="o.id" :class="{ 'sem-prof': !o.professorId }">
            <td class="col-disc">
              {{ discById(o.disciplinaId)?.nome }}
              <div class="small text-muted">
                {{ siglaCurso(o) }} · {{ rotuloPeriodo(discById(o.disciplinaId)) }}
              </div>
            </td>
            <td>
              <input
                class="form-control form-control-sm"
                :value="o.turma"
                placeholder="—"
                aria-label="Turma"
                @change="e => salvar(o, { turma: e.target.value.trim() })"
              />
            </td>
            <td>
              <input
                class="form-control form-control-sm text-center px-1"
                type="number"
                min="0"
                step="0.5"
                :value="o.aulasSemanais"
                aria-label="Aulas semanais"
                @change="e => salvar(o, { aulasSemanais: Number(e.target.value) })"
              />
            </td>
            <td
              v-for="p in professores"
              :key="p.id"
              class="col-prof"
              :class="{ marcado: o.professorId === p.id }"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :checked="o.professorId === p.id"
                :aria-label="`${nomeCurto(p.nome)} ministra ${discById(o.disciplinaId)?.nome}`"
                @change="e => marcar(o, p, e.target.checked)"
              />
            </td>
            <td class="text-center">
              <BButton size="sm" variant="link" class="text-danger p-0" title="Remover do semestre" @click="remover(o)">✕</BButton>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td class="col-disc">Total por professor (aulas/semana)</td>
            <td></td>
            <td class="text-center">{{ fmt(totalSemestre) }}</td>
            <td
              v-for="p in professores"
              :key="p.id"
              class="col-prof"
              :class="`text-${situacao(cargaDe(p.id), p).variant}`"
            >
              {{ fmt(cargaDe(p.id)) }}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <p v-if="ofertasDoSemestre.length" class="small text-muted mt-2">
      Marque a caixinha na coluna do professor que vai ministrar a disciplina. Cada disciplina tem um único professor:
      marcar outro professor transfere a disciplina. Para dividir uma disciplina, adicione-a duas vezes e reparta as aulas.
      Faixa considerada: {{ faixaTexto }}.
    </p>

    <AdicionarDisciplinasModal v-model="modalCatalogo" :turmas-existentes="turmasExistentes" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BRow, BCol, BCard, BButton, BBadge } from 'bootstrap-vue-next'
import AdicionarDisciplinasModal from '../components/AdicionarDisciplinasModal.vue'
import {
  state, acoes, cursoById, discById, rotuloPeriodo, ofertasDoSemestre,
  cargaPorProfessor, situacao, nomeCurto, fmt
} from '../stores/alocacao.js'
import { useNotify } from '../composables/useNotify.js'

const { executar } = useNotify()

// ---------- planilha ----------
const professores = computed(() => [...state.professores].sort((a, b) => a.nome.localeCompare(b.nome)))
const carga = computed(() => cargaPorProfessor(state.semestreAtual))
const cargaDe = id => carga.value.linhas.find(l => l.professor.id === id)?.aulas ?? 0

const ordemCurso = id => state.cursos.findIndex(c => c.id === id)

const grupos = computed(() => {
  const mapa = new Map()
  for (const o of ofertasDoSemestre.value) {
    const d = discById(o.disciplinaId)
    if (!d) continue
    const chave = (o.turma || '').trim()
    if (!mapa.has(chave)) mapa.set(chave, { turma: chave, ofertas: [], total: 0, semProf: 0 })
    const g = mapa.get(chave)
    g.ofertas.push(o)
    g.total += Number(o.aulasSemanais) || 0
    if (!o.professorId) g.semProf += 1
  }
  for (const g of mapa.values()) {
    g.ofertas.sort((a, b) => {
      const da = discById(a.disciplinaId)
      const dbb = discById(b.disciplinaId)
      return ordemCurso(da.cursoId) - ordemCurso(dbb.cursoId) ||
        (da.periodo ?? 99) - (dbb.periodo ?? 99) ||
        da.nome.localeCompare(dbb.nome)
    })
  }
  // Turmas em ordem alfabética; "sem turma" por último
  return [...mapa.values()].sort((a, b) =>
    (a.turma === '') - (b.turma === '') || a.turma.localeCompare(b.turma, 'pt-BR', { numeric: true })
  )
})

const turmasExistentes = computed(() => grupos.value.map(g => g.turma).filter(Boolean))

const totalSemestre = computed(() =>
  ofertasDoSemestre.value.reduce((s, o) => s + (Number(o.aulasSemanais) || 0), 0)
)

const faixaTexto = computed(() => {
  const faixas = new Set(state.professores.map(p => `${p.minAulas}–${p.maxAulas}`))
  return faixas.size === 1 ? `${[...faixas][0]} aulas por professor` : 'definida para cada professor na aba Professores'
})

function siglaCurso (oferta) {
  const curso = cursoById(discById(oferta.disciplinaId)?.cursoId)
  if (!curso) return ''
  if (curso.id.startsWith('ads')) return `ADS ${curso.ppc.replace('PPC ', '')}`
  if (curso.id === 'tds') return 'Téc. Desenv. Sistemas'
  if (curso.id === 'aut') return 'Téc. Automação'
  if (curso.id === 'adm') return 'Administração'
  return curso.nome
}

const salvar = (oferta, dados) => executar(() => acoes.atualizarOferta(oferta.id, dados))

function marcar (oferta, prof, marcado) {
  // Cada disciplina tem um professor: marcar outro substitui; desmarcar deixa sem professor.
  const novo = marcado ? prof.id : (oferta.professorId === prof.id ? null : oferta.professorId)
  if (novo === oferta.professorId) return
  oferta.professorId = novo // resposta imediata na tela; o servidor confirma em seguida
  salvar(oferta, { professorId: novo })
}

async function remover (oferta) {
  const nome = discById(oferta.disciplinaId)?.nome
  if (!window.confirm(`Remover "${nome}" do semestre ${state.semestreAtual}?`)) return
  await executar(() => acoes.removerOferta(oferta.id), 'Oferta removida.')
}

const indicadores = computed(() => {
  const semProf = carga.value.semProfessor
  const docentes = carga.value.linhas.filter(l => l.aulas > 0).length
  return [
    { rotulo: 'Disciplinas', valor: ofertasDoSemestre.value.length },
    { rotulo: 'Turmas', valor: grupos.value.length },
    { rotulo: 'Aulas/semana', valor: fmt(totalSemestre.value) },
    { rotulo: 'Sem professor', valor: fmt(semProf), classe: semProf ? 'text-warning' : 'text-success' },
    { rotulo: 'Docentes alocados', valor: docentes }
  ]
})

const modalCatalogo = ref(false)

// ---------- exportação ----------
function exportarCsv () {
  const linhas = [['Semestre', 'Turma', 'Curso', 'Período', 'Disciplina', 'Aulas/semana', 'Professor']]
  for (const g of grupos.value) {
    for (const o of g.ofertas) {
      const d = discById(o.disciplinaId)
      const prof = state.professores.find(p => p.id === o.professorId)
      linhas.push([
        state.semestreAtual, g.turma, siglaCurso(o), rotuloPeriodo(d), d.nome,
        String(o.aulasSemanais).replace('.', ','), prof?.nome || ''
      ])
    }
  }
  const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `oferta-${state.semestreAtual}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>
