import { getDb } from '../config/database.js'

export const Curso = {
  listar: () => getDb().cursos,
  buscar: id => getDb().cursos.find(c => c.id === id)
}
