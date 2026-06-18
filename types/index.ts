export interface Loja {
  filial: number
  nome: string
  cluster: string
  uf: string
  meta_mensal: number
  giro_3anos: number | null
  ticket_medio: number | null
  potencial: string | null
}

export interface VendaDiaria {
  id: number
  data_venda: string
  filial: number
  categoria: string
  especie: string | null
  quantidade_un: number
  receita: number
  margem: number | null
}

export interface MetaDRE {
  id: number
  mes: string
  categoria: string
  cluster: string
  meta_receita: number
  meta_margem_pct: number
  meta_quantidade_un: number
  preco_venda_sugerido: number
}

export interface CompraAndamento {
  id_compra: string
  fornecedor: string
  categoria: string
  especie: string | null
  quantidade_un: number
  data_fechamento: string
  data_entrega: string
  preco_unitario: number | null
  status: string
}

export interface GFKMercado {
  id: number
  mes: string
  categoria: string
  especie: string
  volume_mercado_un: number | null
  share_nm_pct: number | null
  share_concorrente_pct: number | null
  trend_vs_mes_ant_pct: number | null
}

export interface HistoricoVendas {
  id: number
  mes: string
  categoria: string
  cluster: string
  quantidade_un: number | null
  receita: number | null
  giro_medio: number | null
  sazonalidade_index: number | null
}

// Resultado dos cálculos de readequação
export interface ReadequacaoDia {
  data: string
  dia_semana: string
  indice: number
  meta_recalculada: number
  venda_realizada: number
  status: 'verde' | 'amarelo' | 'vermelho' | 'futuro'
}

export interface PainelSaudeData {
  meta_mensal: number
  venda_realizada: number
  meta_esperada_ate_hoje: number
  desvio_pct: number
  dias_restantes: number
  venda_faltante: number
  ritmo_necessario_medio: number
  aumento_pct: number
  dias: ReadequacaoDia[]
}

// Resultado dos alertas de compras
export interface AlertaCompra extends CompraAndamento {
  ritmo_esperado: number
  ritmo_real: number
  desvio_pct: number
  classificacao: 'critico' | 'atencao' | 'ok'
  acao_recomendada: string
}
