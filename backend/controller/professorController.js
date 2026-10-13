import { Professor } from '../models/Professor.js'

export const listar = (req, res) => res.json(Professor.listar())
export const criar = (req, res) => res.status(201).json(Professor.criar(req.body))
export const atualizar = (req, res) => res.json(Professor.atualizar(req.params.id, req.body))
export const excluir = (req, res) => {
  Professor.excluir(req.params.id)
  res.status(204).end()
}
