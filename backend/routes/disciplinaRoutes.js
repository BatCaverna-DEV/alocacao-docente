import { Router } from 'express'
import * as ctrl from '../controller/disciplinaController.js'

const router = Router()
router.get('/', ctrl.listar)
router.post('/', ctrl.criar)
router.delete('/:id', ctrl.excluir)
export default router
