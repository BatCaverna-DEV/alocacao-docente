<template>
  <div>
    <BNavbar variant="dark" class="bg-dark px-3" toggleable="lg">
      <BNavbarBrand class="fw-semibold text-white">Alocação Docente · IFMA Coelho Neto</BNavbarBrand>
      <div class="d-flex align-items-center gap-2 ms-auto flex-wrap">
        <label for="sel-semestre" class="text-white-50 small mb-0">Semestre</label>
        <BFormSelect
          id="sel-semestre"
          :model-value="state.semestreAtual"
          :options="opcoesSemestre"
          size="sm"
          style="width: 120px"
          @update:model-value="selecionarSemestre"
        />
        <BButton size="sm" variant="outline-light" @click="abrirNovoSemestre">+ Novo semestre</BButton>
        <BButton size="sm" variant="outline-danger" :disabled="!state.semestreAtual" @click="excluirSemestre">
          Excluir semestre
        </BButton>
      </div>
    </BNavbar>

    <BContainer fluid class="pt-3 pb-5">
      <ul class="nav nav-tabs mb-3">
        <li v-for="r in abas" :key="r.name" class="nav-item">
          <RouterLink :to="{ name: r.name }" class="nav-link" active-class="active">{{ r.meta.titulo }}</RouterLink>
        </li>
      </ul>

      <div v-if="state.erro" class="alert alert-danger">
        Não foi possível carregar os dados: {{ state.erro }}. Verifique se o servidor (backend) está rodando.
      </div>

      <div v-if="state.carregando && !state.cursos.length" class="text-center py-5">
        <BSpinner /> <span class="ms-2">Carregando…</span>
      </div>

      <RouterView v-else-if="state.semestreAtual" />

      <div v-else class="alert alert-info">
        Nenhum semestre cadastrado. Clique em <strong>+ Novo semestre</strong> para começar.
      </div>
    </BContainer>

    <NovoSemestreModal ref="modalRef" v-model="modalNovo" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { BNavbar, BNavbarBrand, BFormSelect, BButton, BContainer, BSpinner } from 'bootstrap-vue-next'
import { state, carregar, selecionarSemestre, acoes } from '../stores/alocacao.js'
import { useNotify } from '../composables/useNotify.js'
import NovoSemestreModal from './NovoSemestreModal.vue'

const { executar } = useNotify()
const router = useRouter()
const abas = router.getRoutes().filter(r => r.meta?.titulo).sort((a, b) => a.meta.ordem - b.meta.ordem)

const modalNovo = ref(false)
const modalRef = ref(null)

const opcoesSemestre = computed(() => state.semestres.map(s => ({ value: s.id, text: s.id })))

onMounted(carregar)

async function abrirNovoSemestre () {
  await modalRef.value?.preparar()
  modalNovo.value = true
}

async function excluirSemestre () {
  const id = state.semestreAtual
  if (!window.confirm(`Excluir o semestre ${id} e todas as suas ofertas? Esta ação não pode ser desfeita.`)) return
  await executar(() => acoes.excluirSemestre(id), `Semestre ${id} excluído.`)
}
</script>
