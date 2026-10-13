import { Oferta } from '../models/Oferta.js'

export const listar = (req, res) =>
  res.json(req.query.semestre ? Oferta.doSemestre(req.query.semestre) : Oferta.listar())
export const criar = (req, res) => res.status(201).json(Oferta.criarVarias(req.body))
export const atualizar = (req, res) => res.json(Oferta.atualizar(req.params.id, req.body))
export const excluir = (req, res) => {
  Oferta.excluir(req.params.id)
  res.status(204).end()
}
