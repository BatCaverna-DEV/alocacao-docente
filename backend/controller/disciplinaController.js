import { Disciplina } from '../models/Disciplina.js'

export const listar = (req, res) => res.json(Disciplina.listar())
export const criar = (req, res) => res.status(201).json(Disciplina.criar(req.body))
export const excluir = (req, res) => {
  Disciplina.excluir(req.params.id)
  res.status(204).end()
}
