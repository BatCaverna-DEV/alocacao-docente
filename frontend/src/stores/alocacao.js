import { reactive, computed } from 'vue'
import { api } from '../services/api.js'

// Estado global simples (sem Pinia): os dados cabem todos na memória.
export const state = reactive({
  carregando: true,
  erro: '',
  cursos: [],
  disciplinas: [],
  professores: [],
  semestres: [],
  ofertas: [],
  semestreAtual: localStorage.getItem('semestreAtual') || '2027.1'
})

export async function carregar () {
  state.carregando = true
  try {
    const dados = await api.get('/api/estado')
    Object.assign(state, dados)
    if (!state.semestres.some(s => s.id === state.semestreAtual)) {
      state.semestreAtual = state.semestres.at(-1)?.id || ''
    }
    state.erro = ''
  } catch (e) {
    state.erro = e.message
  } finally {
    state.carregando = false
  }
}

export function selecionarSemestre (id) {
  state.semestreAtual = id
  localStorage.setItem('semestreAtual', id)
}

// ---------- consultas ----------
export const cursoById = id => state.cursos.find(c => c.id === id)
export const discById = id => state.disciplinas.find(d => d.id === id)
export const profById = id => state.professores.find(p => p.id === id)

export function rotuloCurso (curso) {
  return curso ? `${curso.nome} (${curso.ppc})` : ''
}

export function rotuloPeriodo (disc) {
  const curso = cursoById(disc.cursoId)
  if (disc.periodo == null) return 'Optativa'
  return curso?.regime === 'anual' ? `${disc.periodo}º ano` : `${disc.periodo}º período`
}

export const ofertasDoSemestre = computed(() =>
  state.ofertas.filter(o => o.semestreId === state.semestreAtual)
)

export function cargaPorProfessor (semestreId) {
  const mapa = new Map(state.professores.map(p => [p.id, { professor: p, aulas: 0, ofertas: [] }]))
  let semProfessor = 0
  for (const o of state.ofertas) {
    if (o.semestreId !== semestreId) continue
    const item = o.professorId && mapa.get(o.professorId)
    if (item) {
      item.aulas += Number(o.aulasSemanais) || 0
      item.ofertas.push(o)
    } else {
      semProfessor += Number(o.aulasSemanais) || 0
    }
  }
  return { linhas: [...mapa.values()], semProfessor }
}

export function situacao (aulas, prof) {
  if (aulas > prof.maxAulas) return { texto: 'Acima do limite', variant: 'danger' }
  if (aulas < prof.minAulas) return { texto: 'Abaixo do mínimo', variant: 'warning' }
  return { texto: 'Dentro da faixa', variant: 'success' }
}

export const fmt = n => (Math.round(n * 10) / 10).toLocaleString('pt-BR')

// ---------- ações ----------
async function acao (fn) {
  try {
    await fn()
  } finally {
    await carregar()
  }
}

export const acoes = {
  criarSemestre: (id, copiarDe, modoCopia) =>
    acao(async () => {
      await api.post('/api/semestres', { id, copiarDe, modoCopia })
      selecionarSemestre(id)
    }),
  excluirSemestre: id => acao(() => api.del(`/api/semestres/${id}`)),
  ofertar: (disciplinaIds, turma) =>
    acao(() => api.post('/api/ofertas', { semestreId: state.semestreAtual, disciplinaIds, turma })),
  atualizarOferta: (id, dados) => acao(() => api.put(`/api/ofertas/${id}`, dados)),
  removerOferta: id => acao(() => api.del(`/api/ofertas/${id}`)),
  criarProfessor: dados => acao(() => api.post('/api/professores', dados)),
  atualizarProfessor: (id, dados) => acao(() => api.put(`/api/professores/${id}`, dados)),
  excluirProfessor: id => acao(() => api.del(`/api/professores/${id}`)),
  criarDisciplina: dados => acao(() => api.post('/api/disciplinas', dados)),
  excluirDisciplina: id => acao(() => api.del(`/api/disciplinas/${id}`)),
  sugestaoSemestre: () => api.get('/api/semestres/sugestao')
}

// "Bruno Vicente Alves de Lima" -> "Bruno Vicente" (ignora preposições como "de", "da", "dos")
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
export function nomeCurto (nome = '') {
  const partes = nome.trim().split(/\s+/)
  const segundo = partes.slice(1).find(p => !PARTICULAS.has(p.toLowerCase()))
  return segundo ? `${partes[0]} ${segundo}` : partes[0] || ''
}
