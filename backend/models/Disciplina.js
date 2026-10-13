import { getDb, save, nextId } from '../config/database.js'
import { HttpError } from '../config/httpError.js'
import { Curso } from './Curso.js'
import { aulasSemanais } from './seedData.js'

const TIPOS = ['obrigatoria', 'optativa', 'orientacao']

export const Disciplina = {
  listar: () => getDb().disciplinas,

  buscar: id => getDb().disciplinas.find(d => d.id === id),

  // Disciplinas personalizadas (fora do catálogo dos PPCs)
  criar ({ cursoId, nome, ch, periodo, tipo }) {
    const curso = Curso.buscar(cursoId)
    if (!curso) throw new HttpError(400, 'Curso inválido.')
    nome = String(nome || '').trim()
    ch = Number(ch)
    if (!nome || !(ch > 0)) throw new HttpError(400, 'Informe nome e carga horária.')
    const disc = {
      id: `${curso.id}-x${nextId('disc')}`,
      cursoId: curso.id,
      periodo: periodo ? Number(periodo) : null,
      nome,
      ch,
      tipo: TIPOS.includes(tipo) ? tipo : 'obrigatoria',
      aulasSemanais: aulasSemanais(ch, curso.divisor),
      personalizada: true
    }
    getDb().disciplinas.push(disc)
    save()
    return disc
  },

  excluir (id) {
    const db = getDb()
    const disc = this.buscar(id)
    if (!disc) throw new HttpError(404, 'Disciplina não encontrada.')
    if (!disc.personalizada) throw new HttpError(400, 'Só é possível excluir disciplinas personalizadas.')
    if (db.ofertas.some(o => o.disciplinaId === id)) {
      throw new HttpError(409, 'A disciplina está ofertada em algum semestre. Remova as ofertas antes.')
    }
    db.disciplinas = db.disciplinas.filter(d => d.id !== id)
    save()
  }
}
