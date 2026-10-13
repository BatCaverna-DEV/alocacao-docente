import { Router } from 'express'
import * as ctrl from '../controller/semestreController.js'

const router = Router()
router.get('/', ctrl.listar)
router.get('/sugestao', ctrl.sugestao)
router.post('/', ctrl.criar)
router.delete('/:id', ctrl.excluir)
export default router
