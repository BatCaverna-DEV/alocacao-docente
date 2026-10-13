import { Router } from 'express'
import { obterEstado, backup } from '../controller/estadoController.js'
import professorRoutes from './professorRoutes.js'
import disciplinaRoutes from './disciplinaRoutes.js'
import semestreRoutes from './semestreRoutes.js'
import ofertaRoutes from './ofertaRoutes.js'

const router = Router()
router.get('/estado', obterEstado)
router.get('/backup', backup)
router.use('/professores', professorRoutes)
router.use('/disciplinas', disciplinaRoutes)
router.use('/semestres', semestreRoutes)
router.use('/ofertas', ofertaRoutes)
export default router
