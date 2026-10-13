<template>
  <BRow class="g-3">
    <BCol lg="8">
      <div class="table-responsive">
        <table class="table table-sm bg-white align-middle">
          <thead class="table-light">
            <tr>
              <th>Nome</th>
              <th style="width: 7rem" class="num">Mín. aulas</th>
              <th style="width: 7rem" class="num">Máx. aulas</th>
              <th style="width: 8rem" class="num">Em {{ state.semestreAtual }}</th>
              <th style="width: 3rem"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in professoresOrdenados" :key="p.id">
              <td>
                <input class="form-control form-control-sm" :value="p.nome" aria-label="Nome" @change="e => salvar(p, { nome: e.target.value })" />
              </td>
              <td>
                <input class="form-control form-control-sm text-end" type="number" min="0" :value="p.minAulas" aria-label="Mínimo"
                       @change="e => salvar(p, { minAulas: Number(e.target.value) })" />
              </td>
              <td>
                <input class="form-control form-control-sm text-end" type="number" min="0" :value="p.maxAulas" aria-label="Máximo"
                       @change="e => salvar(p, { maxAulas: Number(e.target.value) })" />
              </td>
              <td class="num">
                <BBadge :variant="situacao(cargaAtual(p.id), p).variant">{{ fmt(cargaAtual(p.id)) }}</BBadge>
              </td>
              <td>
                <BButton size="sm" variant="link" class="text-danger p-0" title="Excluir" @click="excluir(p)">✕</BButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="small text-muted">As alterações são salvas ao sair do campo.</p>
    </BCol>

    <BCol lg="4">
      <BCard header="Novo professor" header-class="fw-semibold">
        <BForm @submit.prevent="adicionar">
          <BFormGroup label="Nome" label-for="novo-prof" class="mb-2">
            <BFormInput id="novo-prof" v-model="novo.nome" required />
          </BFormGroup>
          <BRow class="g-2 mb-3">
            <BCol>
              <BFormGroup label="Mín. aulas" label-for="novo-min">
                <BFormInput id="novo-min" v-model="novo.minAulas" type="number" min="0" />
              </BFormGroup>
            </BCol>
            <BCol>
              <BFormGroup label="Máx. aulas" label-for="novo-max">
                <BFormInput id="novo-max" v-model="novo.maxAulas" type="number" min="0" />
              </BFormGroup>
            </BCol>
          </BRow>
          <BButton type="submit" variant="primary" class="w-100">Adicionar</BButton>
        </BForm>
      </BCard>
    </BCol>
  </BRow>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { BRow, BCol, BCard, BForm, BFormGroup, BFormInput, BButton, BBadge } from 'bootstrap-vue-next'
import { state, acoes, cargaPorProfessor, situacao, fmt } from '../stores/alocacao.js'
import { useNotify } from '../composables/useNotify.js'

const { executar } = useNotify()
const novo = reactive({ nome: '', minAulas: 10, maxAulas: 20 })

const professoresOrdenados = computed(() => [...state.professores].sort((a, b) => a.nome.localeCompare(b.nome)))
const carga = computed(() => cargaPorProfessor(state.semestreAtual))
const cargaAtual = id => carga.value.linhas.find(l => l.professor.id === id)?.aulas ?? 0

const salvar = (p, dados) => executar(() => acoes.atualizarProfessor(p.id, dados))

async function adicionar () {
  const ok = await executar(
    () => acoes.criarProfessor({ nome: novo.nome, minAulas: Number(novo.minAulas), maxAulas: Number(novo.maxAulas) }),
    `${novo.nome} cadastrado(a).`
  )
  if (ok) novo.nome = ''
}

async function excluir (p) {
  if (!window.confirm(`Excluir ${p.nome}? As disciplinas atribuídas a ele(a) ficarão sem professor.`)) return
  await executar(() => acoes.excluirProfessor(p.id), 'Professor excluído.')
}
</script>
