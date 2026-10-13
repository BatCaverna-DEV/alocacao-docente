// Erro com código HTTP, lançado pelos models e tratado no middleware de erros (index.js).
export class HttpError extends Error {
  constructor (status, message) {
    super(message)
    this.status = status
  }
}
