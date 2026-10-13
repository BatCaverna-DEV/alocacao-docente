import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config/config.js'
import { getDb } from './config/database.js'
import routes from './routes/index.js'

const app = express()
app.use(express.json())

// API
app.use('/api', routes)
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }))

// Front-end compilado (frontend/dist), se existir
if (fs.existsSync(config.frontendDist)) {
  app.use(express.static(config.frontendDist))
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')))
}

// Tratamento de erros: HttpError lançado pelos models vira resposta JSON
app.use((err, req, res, next) => {
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ erro: status === 500 ? 'Erro interno do servidor.' : err.message })
})

getDb() // carrega (ou cria) o arquivo de dados na inicialização
app.listen(config.port, () => {
  console.log(`Alocação docente em http://localhost:${config.port}`)
  console.log(`Dados: ${config.dbFile}`)
})
