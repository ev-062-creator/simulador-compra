import { CompraAndamento, VendaDiaria, AlertaCompra } from '@/types'

function diffDias(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

export function calcularAlertas(
  compras: CompraAndamento[],
  vendas: VendaDiaria[],
  hoje: string
): AlertaCompra[] {
  return compras.map(c => {
    const diasAteEntrega = diffDias(hoje, c.data_entrega)
    const diasDesde = diffDias(c.data_fechamento, hoje)

    // Ritmo esperado: precisa vender X unidades por dia até a entrega
    const ritmoEsperado = c.quantidade_un / Math.max(1, diasAteEntrega + diasDesde)

    // Vendas reais da categoria desde o fechamento
    const vendasCategoria = vendas.filter(
      v => v.categoria === c.categoria && v.data_venda >= c.data_fechamento && v.data_venda <= hoje
    )
    const totalVendido = vendasCategoria.reduce((s, v) => s + v.quantidade_un, 0)
    const ritmoReal = totalVendido / diasDesde

    const desvioPct = ritmoEsperado > 0
      ? ((ritmoReal - ritmoEsperado) / ritmoEsperado) * 100
      : 0

    let classificacao: AlertaCompra['classificacao']
    let acaoRecomendada: string

    if (desvioPct < -30) {
      classificacao = 'critico'
      acaoRecomendada = 'Renegociar quantidade ou atrasar entrega'
    } else if (desvioPct < -10) {
      classificacao = 'atencao'
      acaoRecomendada = 'Monitorar diariamente'
    } else {
      classificacao = 'ok'
      acaoRecomendada = 'Prosseguir normalmente'
    }

    return { ...c, ritmo_esperado: ritmoEsperado, ritmo_real: ritmoReal, desvio_pct: desvioPct, classificacao, acao_recomendada: acaoRecomendada }
  })
}
