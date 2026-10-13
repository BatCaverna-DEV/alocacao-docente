import { getDb, save, nextId } from '../config/database.js'
import { HttpError } from '../config/httpError.js'

const numero = (v, padrao) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : padrao
}

export const Professor = {
  listar: () => getDb().professores,

  buscar: id => getDb().professores.find(p => p.id === id),

  criar ({ nome, minAulas, maxAulas }) {
    nome = String(nome || '').trim()
    if (!nome) throw new HttpError(400, 'Informe o nome do professor.')
    const prof = {
      id: `p${nextId('prof')}`,
      nome,
      minAulas: numero(minAulas, 10),
      maxAulas: numero(maxAulas, 20)
    }
    getDb().professores.push(prof)
    save()
    return prof
  },

  atualizar (id, { nome, minAulas, maxAulas }) {
    const prof = this.buscar(id)
    if (!prof) throw new HttpError(404, 'Professor não encontrado.')
    if (nome !== undefined) {
      nome = String(nome).trim()
      if (!nome) throw new HttpError(400, 'O nome não pode ficar vazio.')
      prof.nome = nome
    }
    if (minAulas !== undefined) prof.minAulas = numero(minAulas, prof.minAulas)
    if (maxAulas !== undefined) prof.maxAulas = numero(maxAulas, prof.maxAulas)
    save()
    return prof
  },

  excluir (id) {
    const db = getDb()
    if (!this.buscar(id)) throw new HttpError(404, 'Professor não encontrado.')
    db.professores = db.professores.filter(p => p.id !== id)
    // As disciplinas do professor excluído ficam sem professor
    db.ofertas.forEach(o => { if (o.professorId === id) o.professorId = null })
    save()
  }
}
