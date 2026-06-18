import { VendaDiaria, Loja, ReadequacaoDia, PainelSaudeData } from '@/types'

// Índices históricos por dia da semana (0=Dom, 1=Seg, ..., 6=Sab)
const INDICES_DIA: Record<number, number> = {
  0: 0,    // Domingo — fechado
  1: 0.95, // Segunda
  2: 0.98, // Terça
  3: 1.00, // Quarta
  4: 1.02, // Quinta
  5: 1.05, // Sexta
  6: 1.15, // Sábado
}

const NOME_DIA: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
}

// Retorna todos os dias úteis de um mês (exclui domingos)
function diasUteisMes(ano: number, mes: number): Date[] {
  const dias: Date[] = []
  const total = new Date(ano, mes, 0).getDate()
  for (let d = 1; d <= total; d++) {
    const dt = new Date(ano, mes - 1, d)
    if (dt.getDay() !== 0) dias.push(dt)
  }
  return dias
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function calcularPainelSaude(
  vendas: VendaDiaria[],
  lojas: Loja[],
  mes: string, // formato: '2026-06'
  hoje: Date
): PainelSaudeData {
  const [ano, mesNum] = mes.split('-').map(Number)

  const metaMensal = lojas.reduce((s, l) => s + l.meta_mensal, 0)
  const diasMes = diasUteisMes(ano, mesNum)

  // Vendas realizadas no mês
  const vendaMes = vendas.filter(v => v.data_venda.startsWith(mes))
  const vendaRealizada = vendaMes.reduce((s, v) => s + v.receita, 0)

  // Dias já passados (até hoje, inclusive)
  const diasPassados = diasMes.filter(d => d <= hoje)
  const diasRestantes = diasMes.filter(d => d > hoje)

  // Meta esperada até hoje (linear simples para referência de desvio)
  const metaEsperadaAteHoje = (metaMensal / diasMes.length) * diasPassados.length
  const desvioPct = metaEsperadaAteHoje > 0
    ? ((vendaRealizada - metaEsperadaAteHoje) / metaEsperadaAteHoje) * 100
    : 0

  const vendaFaltante = metaMensal - vendaRealizada

  // Peso total dos dias restantes
  const pesoTotal = diasRestantes.reduce((s, d) => s + INDICES_DIA[d.getDay()], 0)
  const ritmoBias = pesoTotal > 0 ? vendaFaltante / pesoTotal : 0

  // Vendas por data para lookup
  const vendasPorData: Record<string, number> = {}
  for (const v of vendaMes) {
    vendasPorData[v.data_venda] = (vendasPorData[v.data_venda] || 0) + v.receita
  }

  // Ritmo necessário médio (para KPI card)
  const ritmoNecessarioMedio = diasRestantes.length > 0 ? vendaFaltante / diasRestantes.length : 0
  const metaDiariaBaseOriginal = metaMensal / diasMes.length
  const aumentoPct = metaDiariaBaseOriginal > 0
    ? ((ritmoNecessarioMedio - metaDiariaBaseOriginal) / metaDiariaBaseOriginal) * 100
    : 0

  // Montar tabela de dias
  const dias: ReadequacaoDia[] = diasMes.map(d => {
    const dataStr = fmt(d)
    const diaSemana = d.getDay()
    const indice = INDICES_DIA[diaSemana]
    const metaRecalculada = d > hoje ? ritmoBias * indice : 0
    const vendaRealDia = vendasPorData[dataStr] || 0

    let status: ReadequacaoDia['status'] = 'futuro'
    if (d <= hoje) {
      const metaEsperadaDia = ritmoBias * indice || metaDiariaBaseOriginal * indice
      const desv = metaEsperadaDia > 0 ? (vendaRealDia - metaEsperadaDia) / metaEsperadaDia : 0
      if (desv >= -0.10) status = 'verde'
      else if (desv >= -0.30) status = 'amarelo'
      else status = 'vermelho'
    }

    return { data: dataStr, dia_semana: NOME_DIA[diaSemana], indice, meta_recalculada: metaRecalculada, venda_realizada: vendaRealDia, status }
  })

  return { meta_mensal: metaMensal, venda_realizada: vendaRealizada, meta_esperada_ate_hoje: metaEsperadaAteHoje, desvio_pct: desvioPct, dias_restantes: diasRestantes.length, venda_faltante: vendaFaltante, ritmo_necessario_medio: ritmoNecessarioMedio, aumento_pct: aumentoPct, dias }
}
