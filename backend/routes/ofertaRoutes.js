import { Router } from 'express'
import * as ctrl from '../controller/ofertaController.js'

const router = Router()
router.get('/', ctrl.listar) // ?semestre=2027.1 para filtrar
router.post('/', ctrl.criar)
router.put('/:id', ctrl.atualizar)
router.delete('/:id', ctrl.excluir)
export default router
