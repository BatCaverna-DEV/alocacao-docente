import fs from 'node:fs'
import path from 'node:path'
import { config } from './config.js'
import { buildSeed } from '../models/seedData.js'

// Persistência simples em arquivo JSON: os dados ficam em memória e são gravados a cada alteração.
let db = null

function persist (data) {
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true })
  const tmp = config.dbFile + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, config.dbFile) // escrita atômica
}

export function getDb () {
  if (!db) {
    if (!fs.existsSync(config.dbFile) && fs.existsSync(config.legacyDbFile)) {
      // Migração: reaproveita os dados da versão anterior (data/db.json na raiz do projeto)
      fs.mkdirSync(path.dirname(config.dbFile), { recursive: true })
      fs.copyFileSync(config.legacyDbFile, config.dbFile)
      console.log(`Dados migrados de ${config.legacyDbFile}`)
    }
    if (fs.existsSync(config.dbFile)) {
      db = JSON.parse(fs.readFileSync(config.dbFile, 'utf-8'))
    } else {
      db = buildSeed()
      persist(db)
    }
  }
  return db
}

export function save () {
  persist(getDb())
}

export function nextId (contador) {
  const d = getDb()
  d.seq[contador] = (d.seq[contador] || 0) + 1
  return d.seq[contador]
}
