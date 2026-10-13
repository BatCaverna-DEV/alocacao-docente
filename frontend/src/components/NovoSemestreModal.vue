<template>
  <BModal v-model="aberto" title="Novo semestre" ok-title="Criar" cancel-title="Cancelar" @ok="criar">
    <BFormGroup label="Semestre (AAAA.S)" label-for="novo-id" class="mb-3">
      <BFormInput id="novo-id" v-model="form.id" placeholder="2027.2" />
    </BFormGroup>
    <BFormGroup label="Copiar ofertas de" label-for="novo-origem" class="mb-3">
      <BFormSelect id="novo-origem" v-model="form.copiarDe" :options="opcoesOrigem" />
    </BFormGroup>
    <BFormGroup v-if="form.copiarDe" label="O que copiar">
      <BFormRadioGroup v-model="form.modoCopia" :options="modosCopia" stacked />
    </BFormGroup>
    <p class="small text-muted mb-0">
      As disciplinas dos cursos técnicos são anuais: ao criar o 2º semestre do ano, copie as ofertas anuais
      para que elas continuem contando na carga dos professores.
    </p>
  </BModal>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { BModal, BFormGroup, BFormInput, BFormSelect, BFormRadioGroup } from 'bootstrap-vue-next'
import { state, acoes } from '../stores/alocacao.js'
import { useNotify } from '../composables/useNotify.js'

const aberto = defineModel({ type: Boolean, default: false })
const { executar } = useNotify()

const form = reactive({ id: '', copiarDe: null, modoCopia: 'anuais' })

const modosCopia = [
  { value: 'anuais', text: 'Somente disciplinas anuais (cursos técnicos)' },
  { value: 'todas', text: 'Todas as ofertas, com os professores' }
]

const opcoesOrigem = computed(() => [
  { value: null, text: '— não copiar —' },
  ...state.semestres.map(s => ({ value: s.id, text: s.id }))
])

// Ao abrir: sugere o próximo semestre e, se for AAAA.2, a cópia das disciplinas anuais do AAAA.1
async function preparar () {
  try {
    form.id = (await acoes.sugestaoSemestre()).id
  } catch {
    form.id = ''
  }
  const [ano, sem] = form.id.split('.')
  const primeiro = `${ano}.1`
  form.copiarDe = sem === '2' && state.semestres.some(s => s.id === primeiro) ? primeiro : null
  form.modoCopia = 'anuais'
}

defineExpose({ preparar })

async function criar (evento) {
  evento?.preventDefault?.()
  const id = form.id.trim()
  const ok = await executar(
    () => acoes.criarSemestre(id, form.copiarDe, form.copiarDe ? form.modoCopia : 'nenhuma'),
    `Semestre ${id} criado.`
  )
  if (ok) aberto.value = false
}
</script>
