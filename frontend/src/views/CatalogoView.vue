<template>
  <BRow class="g-3">
    <BCol lg="8">
      <BCard v-for="curso in state.cursos" :key="curso.id" no-body class="mb-3">
        <div class="card-header d-flex justify-content-between">
          <strong>{{ rotuloCurso(curso) }}</strong>
          <span class="small text-muted">
            {{ curso.regime === 'anual' ? 'Anual · aulas = CH ÷ 40' : 'Semestral · aulas = CH ÷ 15' }}
          </span>
        </div>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 8rem">Período</th>
                <th>Disciplina</th>
                <th class="num" style="width: 6rem">CH ({{ curso.unidade }})</th>
                <th class="num" style="width: 5rem">Aulas</th>
                <th style="width: 2.5rem"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in disciplinasDo(curso.id)" :key="d.id">
                <td class="small">{{ rotuloPeriodo(d) }}</td>
                <td>
                  {{ d.nome }}
                  <BBadge v-if="d.tipo === 'orientacao'" variant="secondary" class="ms-1">TCC/Extensão</BBadge>
                  <BBadge v-if="d.personalizada" variant="light" class="ms-1 border">personalizada</BBadge>
                </td>
                <td class="num">{{ d.ch }}</td>
                <td class="num">{{ fmt(d.aulasSemanais) }}</td>
                <td>
                  <BButton v-if="d.personalizada" size="sm" variant="link" class="text-danger p-0" title="Excluir" @click="excluir(d)">✕</BButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>
    </BCol>

    <BCol lg="4">
      <BCard header="Nova disciplina" header-class="fw-semibold" class="sticky-card">
        <p class="small text-muted">
          Use para disciplinas que não estão no catálogo (ex.: optativa nova, equivalência ou componente de outro curso).
        </p>
        <BForm @submit.prevent="adicionar">
          <BFormGroup label="Curso" label-for="nd-curso" class="mb-2">
            <BFormSelect id="nd-curso" v-model="nova.cursoId" :options="opcoesCurso" />
          </BFormGroup>
          <BFormGroup label="Nome" label-for="nd-nome" class="mb-2">
            <BFormInput id="nd-nome" v-model="nova.nome" required />
          </BFormGroup>
          <BRow class="g-2 mb-2">
            <BCol>
              <BFormGroup :label="`CH (${cursoById(nova.cursoId)?.unidade})`" label-for="nd-ch">
                <BFormInput id="nd-ch" v-model="nova.ch" type="number" min="1" required />
              </BFormGroup>
            </BCol>
            <BCol>
              <BFormGroup label="Período/ano" label-for="nd-per">
                <BFormInput id="nd-per" v-model="nova.periodo" type="number" min="1" placeholder="vazio = optativa" />
              </BFormGroup>
            </BCol>
          </BRow>
          <BFormGroup label="Tipo" label-for="nd-tipo" class="mb-3">
            <BFormSelect id="nd-tipo" v-model="nova.tipo" :options="tipos" />
          </BFormGroup>
          <p class="small mb-3">
            Aulas semanais: <strong>{{ previaAulas }}</strong>
          </p>
          <BButton type="submit" variant="primary" class="w-100">Adicionar ao catálogo</BButton>
        </BForm>
      </BCard>
    </BCol>
  </BRow>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { BRow, BCol, BCard, BForm, BFormGroup, BFormInput, BFormSelect, BButton, BBadge } from 'bootstrap-vue-next'
import { state, acoes, cursoById, rotuloCurso, rotuloPeriodo, fmt } from '../stores/alocacao.js'
import { useNotify } from '../composables/useNotify.js'

const { executar } = useNotify()
const nova = reactive({ cursoId: 'ads2025', nome: '', ch: 60, periodo: '', tipo: 'obrigatoria' })

const tipos = [
  { value: 'obrigatoria', text: 'Obrigatória' },
  { value: 'optativa', text: 'Optativa' },
  { value: 'orientacao', text: 'TCC / Extensão' }
]

const opcoesCurso = computed(() => state.cursos.map(c => ({ value: c.id, text: rotuloCurso(c) })))

const previaAulas = computed(() => {
  const curso = cursoById(nova.cursoId)
  return curso ? fmt(Number(nova.ch || 0) / curso.divisor) : '—'
})

const disciplinasDo = cursoId =>
  state.disciplinas
    .filter(d => d.cursoId === cursoId)
    .sort((a, b) => (a.periodo ?? 99) - (b.periodo ?? 99) || a.nome.localeCompare(b.nome))

async function adicionar () {
  const ok = await executar(
    () => acoes.criarDisciplina({ ...nova, ch: Number(nova.ch), periodo: nova.periodo || null }),
    `${nova.nome} adicionada ao catálogo.`
  )
  if (ok) { nova.nome = ''; nova.periodo = '' }
}

async function excluir (d) {
  if (!window.confirm(`Excluir "${d.nome}" do catálogo?`)) return
  await executar(() => acoes.excluirDisciplina(d.id), 'Disciplina excluída.')
}
</script>
