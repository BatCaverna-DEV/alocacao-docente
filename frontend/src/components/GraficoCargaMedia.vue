<template>
  <BCard class="mb-4">
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
      <div>
        <h5 class="mb-0">Evolução da carga média</h5>
        <div class="small text-muted">Média de aulas semanais por professor em cada semestre</div>
      </div>
      <div class="small text-muted d-flex align-items-center gap-3">
        <span class="d-flex align-items-center gap-1"><span class="chave-linha" /> Carga média</span>
        <span class="d-flex align-items-center gap-1"><span class="chave-faixa" /> Faixa média (mín.–máx.)</span>
      </div>
    </div>

    <div ref="caixa" class="grafico-caixa" @pointerleave="foco = null">
      <svg
        :width="largura"
        :height="ALTURA"
        role="img"
        :aria-label="`Gráfico de linha: carga média por professor em ${pontos.length} semestre(s)`"
        @pointermove="mover"
      >
        <!-- grade e eixo Y -->
        <g v-for="t in ticks" :key="t">
          <line :x1="M.esq" :x2="largura - M.dir" :y1="y(t)" :y2="y(t)" :class="t === 0 ? 'eixo' : 'grade'" />
          <text :x="M.esq - 8" :y="y(t)" class="rotulo-eixo" text-anchor="end" dominant-baseline="middle">{{ fmt(t) }}</text>
        </g>

        <!-- faixa de referência (média dos mínimos e máximos) -->
        <rect
          :x="M.esq"
          :y="y(faixa.max)"
          :width="largura - M.esq - M.dir"
          :height="Math.max(0, y(faixa.min) - y(faixa.max))"
          class="faixa"
        />

        <!-- eixo X -->
        <text
          v-for="p in pontos"
          :key="p.id"
          :x="x(p.indice)"
          :y="ALTURA - M.inf + 20"
          class="rotulo-eixo"
          :class="{ atual: p.id === state.semestreAtual }"
          text-anchor="middle"
        >{{ p.id }}</text>

        <!-- crosshair -->
        <line v-if="pontoFoco" :x1="x(pontoFoco.indice)" :x2="x(pontoFoco.indice)" :y1="M.sup" :y2="ALTURA - M.inf" class="crosshair" />

        <!-- série -->
        <polyline v-if="pontos.length > 1" :points="caminho" class="linha" />
        <circle
          v-for="p in pontos"
          :key="p.id"
          :cx="x(p.indice)"
          :cy="y(p.media)"
          :r="pontoFoco?.id === p.id ? 6 : 4.5"
          class="marcador"
        />

        <!-- rótulo direto no último ponto -->
        <text
          v-if="ultimo"
          :x="x(ultimo.indice)"
          :y="y(ultimo.media) - 12"
          class="rotulo-valor"
          text-anchor="middle"
        >{{ fmt(ultimo.media) }}</text>
      </svg>

      <div
        v-if="pontoFoco"
        class="dica shadow-sm"
        :style="{ left: `${x(pontoFoco.indice)}px`, top: `${y(pontoFoco.media)}px` }"
      >
        <div class="fw-semibold">{{ fmt(pontoFoco.media) }} aulas/semana</div>
        <div class="small text-muted">Média em {{ pontoFoco.id }}</div>
        <div class="small text-muted">{{ fmt(pontoFoco.total) }} aulas atribuídas · {{ pontoFoco.professores }} professores</div>
      </div>
    </div>

    <details class="small mt-2">
      <summary class="text-muted">Ver dados em tabela</summary>
      <table class="table table-sm mt-2 mb-0">
        <thead class="table-light">
          <tr>
            <th>Semestre</th>
            <th class="num">Aulas atribuídas</th>
            <th class="num">Professores</th>
            <th class="num">Média</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pontos" :key="p.id">
            <td>{{ p.id }}</td>
            <td class="num">{{ fmt(p.total) }}</td>
            <td class="num">{{ p.professores }}</td>
            <td class="num">{{ fmt(p.media) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-muted mt-2 mb-0">
        Média = aulas atribuídas a professores ÷ professores cadastrados. Aulas sem professor não entram na média.
      </p>
    </details>
  </BCard>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { BCard } from 'bootstrap-vue-next'
import { state, cargaPorProfessor, fmt } from '../stores/alocacao.js'

const ALTURA = 260
const M = { sup: 24, dir: 24, inf: 36, esq: 44 }

// Largura real do contêiner, para o texto não escalar com o SVG
const caixa = ref(null)
const largura = ref(600)
let observador
onMounted(() => {
  observador = new ResizeObserver(([e]) => { largura.value = Math.max(280, e.contentRect.width) })
  observador.observe(caixa.value)
})
onBeforeUnmount(() => observador?.disconnect())

const pontos = computed(() => {
  const n = state.professores.length
  return state.semestres.map((s, indice) => {
    const { linhas } = cargaPorProfessor(s.id)
    const total = linhas.reduce((soma, l) => soma + l.aulas, 0)
    return { id: s.id, indice, total, professores: n, media: n ? total / n : 0 }
  })
})

const ultimo = computed(() => pontos.value.at(-1))

// Faixa de referência: média dos mínimos e dos máximos dos professores
const faixa = computed(() => {
  const n = state.professores.length || 1
  return {
    min: state.professores.reduce((s, p) => s + p.minAulas, 0) / n,
    max: state.professores.reduce((s, p) => s + p.maxAulas, 0) / n
  }
})

// Escala Y com teto "redondo"
const passo = computed(() => {
  const topo = Math.max(faixa.value.max, ...pontos.value.map(p => p.media), 1)
  return [1, 2, 5, 10, 20, 50].find(s => topo / s <= 5) || 100
})
const yMax = computed(() => {
  const topo = Math.max(faixa.value.max, ...pontos.value.map(p => p.media), 1)
  return Math.ceil(topo / passo.value) * passo.value
})
const ticks = computed(() => Array.from({ length: yMax.value / passo.value + 1 }, (_, i) => i * passo.value))

const y = v => M.sup + (1 - v / yMax.value) * (ALTURA - M.sup - M.inf)
const x = i => {
  const n = pontos.value.length
  const util = largura.value - M.esq - M.dir
  return n <= 1 ? M.esq + util / 2 : M.esq + 16 + (i / (n - 1)) * (util - 32)
}

const caminho = computed(() => pontos.value.map(p => `${x(p.indice)},${y(p.media)}`).join(' '))

// Crosshair: encaixa no semestre mais próximo do ponteiro
const foco = ref(null)
const pontoFoco = computed(() => (foco.value == null ? null : pontos.value[foco.value]))
function mover (e) {
  if (!pontos.value.length) return
  const px = e.clientX - e.currentTarget.getBoundingClientRect().left
  let melhor = 0
  pontos.value.forEach((p, i) => { if (Math.abs(x(i) - px) < Math.abs(x(melhor) - px)) melhor = i })
  foco.value = melhor
}
</script>

<style scoped>
.grafico-caixa {
  position: relative;
  --serie: #2a78d6;
  --grade: #e1e0d9;
  --eixo: #c3c2b7;
  --tinta-suave: #898781;
  --tinta: #0b0b0b;
}
svg { display: block; touch-action: none; }
.grade { stroke: var(--grade); stroke-width: 1; }
.eixo { stroke: var(--eixo); stroke-width: 1; }
.faixa { fill: var(--serie); opacity: 0.08; }
.crosshair { stroke: var(--eixo); stroke-width: 1; }
.linha { fill: none; stroke: var(--serie); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.marcador { fill: var(--serie); stroke: #fff; stroke-width: 2; transition: r 0.1s; }
.rotulo-eixo { fill: var(--tinta-suave); font-size: 12px; font-variant-numeric: tabular-nums; }
.rotulo-eixo.atual { fill: var(--tinta); font-weight: 600; }
.rotulo-valor { fill: var(--tinta); font-size: 13px; font-weight: 600; }
.dica {
  position: absolute;
  transform: translate(-50%, calc(-100% - 14px));
  background: #fff;
  border: 1px solid rgba(11, 11, 11, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  pointer-events: none;
  white-space: nowrap;
}
.chave-linha { display: inline-block; width: 16px; height: 2px; background: #2a78d6; border-radius: 1px; }
.chave-faixa { display: inline-block; width: 12px; height: 12px; background: rgba(42, 120, 214, 0.15); border-radius: 2px; }
</style>
