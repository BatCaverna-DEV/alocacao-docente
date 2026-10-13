import { Router } from 'express'
import * as ctrl from '../controller/professorController.js'

const router = Router()
router.get('/', ctrl.listar)
router.post('/', ctrl.criar)
router.put('/:id', ctrl.atualizar)
router.delete('/:id', ctrl.excluir)
export default router
