import { Curso } from '../models/Curso.js'

export const listar = (req, res) => res.json(Curso.listar())
export const criar = (req, res) => res.status(201).json(Curso.criar(req.body))
export const excluir = (req, res) => {
  Curso.excluir(req.params.id)
  res.status(204).end()
}
