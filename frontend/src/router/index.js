import { createRouter, createWebHashHistory } from 'vue-router'
import OfertaView from '../views/OfertaView.vue'

// meta.titulo/ordem definem as abas exibidas no AppLayout
const routes = [
  { path: '/', redirect: '/oferta' },
  { path: '/oferta', name: 'oferta', component: OfertaView, meta: { titulo: 'Oferta do semestre', ordem: 1 } },
  { path: '/carga', name: 'carga', component: () => import('../views/CargaDocenteView.vue'), meta: { titulo: 'Carga docente', ordem: 2 } },
  { path: '/professores', name: 'professores', component: () => import('../views/ProfessoresView.vue'), meta: { titulo: 'Professores', ordem: 3 } },
  { path: '/catalogo', name: 'catalogo', component: () => import('../views/CatalogoView.vue'), meta: { titulo: 'Catálogo de disciplinas', ordem: 4 } },
  { path: '/:pathMatch(.*)*', redirect: '/oferta' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
