import { getDb } from '../config/database.js'
import { Curso } from '../models/Curso.js'
import { Disciplina } from '../models/Disciplina.js'
import { Professor } from '../models/Professor.js'
import { Semestre } from '../models/Semestre.js'
import { Oferta } from '../models/Oferta.js'

// GET /api/estado — tudo que o front-end precisa em uma só requisição
export function obterEstado (req, res) {
  res.json({
    cursos: Curso.listar(),
    disciplinas: Disciplina.listar(),
    professores: Professor.listar(),
    semestres: Semestre.listar(),
    ofertas: Oferta.listar()
  })
}

// GET /api/backup — baixa o arquivo de dados completo
export function backup (req, res) {
  res.setHeader('Content-Disposition', 'attachment; filename="alocacao-docente-backup.json"')
  res.json(getDb())
}
