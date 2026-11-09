import { getDb, save, nextId } from '../config/database.js'
import { HttpError } from '../config/httpError.js'

// Padrões por nível: superior conta CH em horas (1 aula/semana a cada 15 h);
// técnico conta CH anual em hora-aula (÷ 40 semanas).
const NIVEIS = {
  superior: { unidade: 'h', divisor: 15, regime: 'semestral' },
  tecnico: { unidade: 'h/a', divisor: 40, regime: 'anual' }
}
const REGIMES = ['semestral', 'anual']

export const Curso = {
  listar: () => getDb().cursos,

  buscar: id => getDb().cursos.find(c => c.id === id),

  criar ({ nome, ppc, nivel, regime }) {
    nome = String(nome || '').trim()
    ppc = String(ppc || '').trim()
    if (!nome) throw new HttpError(400, 'Informe o nome do curso.')
    if (!NIVEIS[nivel]) throw new HttpError(400, 'Nível inválido (use superior ou tecnico).')
    if (regime !== undefined && regime !== '' && !REGIMES.includes(regime)) {
      throw new HttpError(400, 'Regime inválido (use semestral ou anual).')
    }
    const db = getDb()
    const chave = s => s.toLocaleLowerCase('pt-BR')
    if (db.cursos.some(c => chave(c.nome) === chave(nome) && chave(c.ppc || '') === chave(ppc))) {
      throw new HttpError(409, 'Já existe um curso com esse nome e PPC.')
    }
    const padrao = NIVEIS[nivel]
    const curso = {
      id: `c${nextId('curso')}`,
      nome,
      ppc: ppc || 'PPC vigente',
      nivel,
      regime: regime || padrao.regime,
      unidade: padrao.unidade,
      divisor: padrao.divisor
    }
    db.cursos.push(curso)
    save()
    return curso
  },

  // Só cursos sem disciplinas cadastradas podem ser excluídos
  excluir (id) {
    const db = getDb()
    if (!this.buscar(id)) throw new HttpError(404, 'Curso não encontrado.')
    if (db.disciplinas.some(d => d.cursoId === id)) {
      throw new HttpError(409, 'O curso possui disciplinas no catálogo. Exclua-as antes.')
    }
    db.cursos = db.cursos.filter(c => c.id !== id)
    save()
  }
}
