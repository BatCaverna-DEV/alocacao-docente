import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const config = {
  port: Number(process.env.PORT || 3000),
  // Arquivo de dados (JSON). Criado automaticamente na primeira execução.
  dbFile: process.env.DB_FILE || path.join(BACKEND_DIR, 'data', 'db.json'),
  // Local do arquivo de dados na versão anterior (data/db.json na raiz); migrado automaticamente
  legacyDbFile: path.resolve(BACKEND_DIR, '..', 'data', 'db.json'),
  // Front-end compilado (npm run build na pasta frontend), servido pelo próprio Express.
  frontendDist: path.resolve(BACKEND_DIR, '..', 'frontend', 'dist')
}
