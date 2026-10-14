<template>
  <div>
    <h5 class="mb-3">Carga semanal dos professores em {{ state.semestreAtual }}</h5>

    <div v-if="carga.semProfessor" class="alert alert-warning py-2">
      {{ fmt(carga.semProfessor) }} aula(s) semanais ainda sem professor atribuído neste semestre.
    </div>

    <BRow class="g-3 mb-4">
      <BCol v-for="linha in linhasOrdenadas" :key="linha.professor.id" md="6" xl="4">
        <BCard class="h-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="fw-semibold">{{ linha.professor.nome }}</div>
              <div class="small text-muted">Faixa: {{ linha.professor.minAulas }}–{{ linha.professor.maxAulas }} aulas</div>
            </div>
            <BBadge :variant="situacao(linha.aulas, linha.professor).variant">
              {{ situacao(linha.aulas, linha.professor).texto }}
            </BBadge>
          </div>

          <div class="d-flex align-items-baseline gap-2">
            <span class="fs-3 fw-semibold">{{ fmt(linha.aulas) }}</span>
            <span class="text-muted">aulas/semana</span>
          </div>
          <div class="progress my-2" style="height: 8px" role="progressbar" :aria-valuenow="linha.aulas" aria-valuemin="0" :aria-valuemax="linha.professor.maxAulas">
            <div
              class="progress-bar"
              :class="`bg-${situacao(linha.aulas, linha.professor).variant}`"
              :style="{ width: Math.min(100, (linha.aulas / (linha.professor.maxAulas || 1)) * 100) + '%' }"
            />
          </div>

          <ul v-if="linha.ofertas.length" class="list-unstyled small mb-0">
            <li v-for="o in linha.ofertas" :key="o.id" class="d-flex justify-content-between border-top py-1">
              <span>
                {{ discById(o.disciplinaId)?.nome }}
                <span class="text-muted">· {{ siglaCurso(o) }}{{ o.turma ? ` · ${o.turma}` : '' }}</span>
              </span>
              <span class="num">{{ fmt(o.aulasSemanais) }}</span>
            </li>
          </ul>
          <div v-else class="small text-muted">Nenhuma disciplina atribuída.</div>
        </BCard>
      </BCol>
    </BRow>

    <GraficoCargaMedia />

    <h5 class="mb-2">Visão geral por semestre</h5>
    <p class="small text-muted">Aulas semanais de cada professor em todos os semestres cadastrados.</p>
    <div class="table-responsive">
      <table class="table table-sm table-bordered bg-white">
        <thead class="table-light">
          <tr>
            <th>Professor</th>
            <th v-for="s in state.semestres" :key="s.id" class="num" :class="{ 'table-primary': s.id === state.semestreAtual }">
              {{ s.id }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in professoresOrdenados" :key="p.id">
            <td>{{ p.nome }}</td>
            <td
              v-for="s in state.semestres"
              :key="s.id"
              class="num"
              :class="`text-${situacao(cargaEm(s.id, p.id), p).variant}`"
            >
              {{ fmt(cargaEm(s.id, p.id)) }}
            </td>
          </tr>
          <tr class="table-light">
            <td><em>Sem professor</em></td>
            <td v-for="s in state.semestres" :key="s.id" class="num">{{ fmt(cargas[s.id].semProfessor) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BRow, BCol, BCard, BBadge } from 'bootstrap-vue-next'
import GraficoCargaMedia from '../components/GraficoCargaMedia.vue'
import { state, discById, cursoById, cargaPorProfessor, situacao, fmt } from '../stores/alocacao.js'

const carga = computed(() => cargaPorProfessor(state.semestreAtual))

const linhasOrdenadas = computed(() =>
  [...carga.value.linhas].sort((a, b) => b.aulas - a.aulas || a.professor.nome.localeCompare(b.professor.nome))
)

const professoresOrdenados = computed(() => [...state.professores].sort((a, b) => a.nome.localeCompare(b.nome)))

const cargas = computed(() =>
  Object.fromEntries(state.semestres.map(s => [s.id, cargaPorProfessor(s.id)]))
)

const cargaEm = (semestreId, profId) =>
  cargas.value[semestreId]?.linhas.find(l => l.professor.id === profId)?.aulas ?? 0

function siglaCurso (oferta) {
  const curso = cursoById(discById(oferta.disciplinaId)?.cursoId)
  if (!curso) return ''
  return curso.id.startsWith('ads') ? `ADS ${curso.ppc.replace('PPC ', '')}` : curso.nome.replace('Técnico em ', 'Téc. ')
}
</script>
