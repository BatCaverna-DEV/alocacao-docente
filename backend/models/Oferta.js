import { getDb, save, nextId } from '../config/database.js'
import { HttpError } from '../config/httpError.js'
import { Disciplina } from './Disciplina.js'
import { Professor } from './Professor.js'

const numero = (v, padrao) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : padrao
}

export const Oferta = {
  listar: () => getDb().ofertas,

  doSemestre: semestreId => getDb().ofertas.filter(o => o.semestreId === semestreId),

  // Cria a oferta em memória (sem gravar); usado também ao copiar semestres.
  montar ({ semestreId, disciplinaId, turma = '', professorId = null, aulasSemanais, observacao = '' }) {
    const disc = Disciplina.buscar(disciplinaId)
    return {
      id: `o${nextId('oferta')}`,
      semestreId,
      disciplinaId,
      turma,
      professorId,
      aulasSemanais: aulasSemanais ?? disc.aulasSemanais,
      observacao
    }
  },

  criarVarias ({ semestreId, disciplinaIds = [], turma = '' }) {
    if (!getDb().semestres.some(s => s.id === semestreId)) throw new HttpError(400, 'Semestre inválido.')
    const criadas = disciplinaIds
      .filter(id => Disciplina.buscar(id))
      .map(disciplinaId => this.montar({ semestreId, disciplinaId, turma: String(turma).trim() }))
    if (!criadas.length) throw new HttpError(400, 'Nenhuma disciplina válida selecionada.')
    getDb().ofertas.push(...criadas)
    save()
    return criadas
  },

  atualizar (id, { professorId, turma, aulasSemanais, observacao }) {
    const oferta = getDb().ofertas.find(o => o.id === id)
    if (!oferta) throw new HttpError(404, 'Oferta não encontrada.')
    if (professorId !== undefined) {
      if (professorId !== null && !Professor.buscar(professorId)) throw new HttpError(400, 'Professor inválido.')
      oferta.professorId = professorId
    }
    if (turma !== undefined) oferta.turma = String(turma).trim()
    if (aulasSemanais !== undefined) oferta.aulasSemanais = numero(aulasSemanais, oferta.aulasSemanais)
    if (observacao !== undefined) oferta.observacao = String(observacao)
    save()
    return oferta
  },

  excluir (id) {
    const db = getDb()
    const antes = db.ofertas.length
    db.ofertas = db.ofertas.filter(o => o.id !== id)
    if (db.ofertas.length === antes) throw new HttpError(404, 'Oferta não encontrada.')
    save()
  }
}
