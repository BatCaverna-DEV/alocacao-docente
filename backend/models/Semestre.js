import { getDb, save } from '../config/database.js'
import { HttpError } from '../config/httpError.js'
import { Curso } from './Curso.js'
import { Disciplina } from './Disciplina.js'
import { Oferta } from './Oferta.js'

const FORMATO = /^\d{4}\.[12]$/

export const Semestre = {
  listar: () => [...getDb().semestres].sort((a, b) => a.id.localeCompare(b.id)),

  existe: id => getDb().semestres.some(s => s.id === id),

  proximo () {
    const ids = this.listar().map(s => s.id)
    if (!ids.length) return '2027.1'
    const [ano, sem] = ids.at(-1).split('.').map(Number)
    return sem === 1 ? `${ano}.2` : `${ano + 1}.1`
  },

  // modoCopia: 'anuais' (só disciplinas dos cursos técnicos anuais), 'todas' ou 'nenhuma'
  criar ({ id, copiarDe, modoCopia = 'anuais' }) {
    id = String(id || '').trim()
    if (!FORMATO.test(id)) throw new HttpError(400, 'Use o formato AAAA.S, por exemplo 2027.2.')
    if (this.existe(id)) throw new HttpError(409, `O semestre ${id} já existe.`)

    const db = getDb()
    db.semestres.push({ id, criadoEm: new Date().toISOString() })

    if (copiarDe && modoCopia !== 'nenhuma') {
      for (const o of Oferta.doSemestre(copiarDe)) {
        const curso = Curso.buscar(Disciplina.buscar(o.disciplinaId)?.cursoId)
        if (modoCopia === 'anuais' && curso?.regime !== 'anual') continue
        db.ofertas.push(Oferta.montar({ ...o, semestreId: id }))
      }
    }
    save()
    return { id }
  },

  excluir (id) {
    const db = getDb()
    if (!this.existe(id)) throw new HttpError(404, 'Semestre não encontrado.')
    db.semestres = db.semestres.filter(s => s.id !== id)
    db.ofertas = db.ofertas.filter(o => o.semestreId !== id)
    save()
  }
}
