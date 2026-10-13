import { useToast } from 'bootstrap-vue-next'

// Deve ser chamado dentro do setup() de um componente filho de <BApp>.
export function useNotify () {
  const { create } = useToast()

  const ok = body => create({ title: 'Pronto', body, variant: 'success', modelValue: 3000 })
  const erro = e => create({ title: 'Erro', body: e?.message || String(e), variant: 'danger', modelValue: 6000 })

  // Executa uma ação assíncrona e mostra o resultado em um toast.
  async function executar (fn, mensagemOk) {
    try {
      await fn()
      if (mensagemOk) ok(mensagemOk)
      return true
    } catch (e) {
      erro(e)
      return false
    }
  }

  return { ok, erro, executar }
}
