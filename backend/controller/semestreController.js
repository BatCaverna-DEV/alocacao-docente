import { Semestre } from '../models/Semestre.js'

export const listar = (req, res) => res.json(Semestre.listar())
export const sugestao = (req, res) => res.json({ id: Semestre.proximo() })
export const criar = (req, res) => res.status(201).json(Semestre.criar(req.body))
export const excluir = (req, res) => {
  Semestre.excluir(req.params.id)
  res.status(204).end()
}
