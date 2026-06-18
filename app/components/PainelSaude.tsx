'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { calcularPainelSaude } from '@/utils/readequacao'
import { PainelSaudeData, VendaDiaria, Loja } from '@/types'

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const PCT = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

const STATUS_LABEL: Record<string, string> = {
  verde: '🟢',
  amarelo: '🟡',
  vermelho: '🔴',
  futuro: '—',
}

export default function PainelSaude() {
  const [painel, setPainel] = useState<PainelSaudeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [mes, setMes] = useState('2026-06')

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      setErro(null)
      try {
        const sb = getSupabase()
        const [a, m] = mes.split('-').map(Number)
        const fimMes = new Date(a, m, 0).toISOString().split('T')[0]
        const [{ data: lojas, error: e1 }, { data: vendas, error: e2 }] = await Promise.all([
          sb.from('sim_lojas').select('*'),
          sb.from('sim_venda_diaria').select('*').gte('data_venda', `${mes}-01`).lte('data_venda', fimMes),
        ])

        if (e1 || e2) throw new Error(e1?.message || e2?.message)

        const resultado = calcularPainelSaude(
          (vendas || []) as VendaDiaria[],
          (lojas || []) as Loja[],
          mes,
          new Date('2026-06-18')
        )
        setPainel(resultado)
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [mes])

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>
  if (erro) return <p className="text-sm text-red-600">Erro: {erro}</p>
  if (!painel) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Saúde do Mês</h1>
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Meta Mensal" value={BRL(painel.meta_mensal)} />
        <KPICard label="Venda Realizada" value={BRL(painel.venda_realizada)} />
        <KPICard
          label="Desvio vs. Esperado"
          value={PCT(painel.desvio_pct)}
          highlight={painel.desvio_pct < -10 ? 'red' : painel.desvio_pct < 0 ? 'yellow' : 'green'}
        />
        <KPICard
          label="Ritmo Necessário/dia"
          value={BRL(painel.ritmo_necessario_medio)}
          sub={`${PCT(painel.aumento_pct)} vs. meta original`}
          highlight={painel.aumento_pct > 30 ? 'red' : painel.aumento_pct > 10 ? 'yellow' : 'green'}
        />
      </div>

      {/* Resumo */}
      <div className="bg-white border border-gray-200 rounded p-4 text-sm text-gray-700 flex gap-6">
        <span>Venda faltante: <strong>{BRL(painel.venda_faltante)}</strong></span>
        <span>Dias restantes: <strong>{painel.dias_restantes}</strong></span>
      </div>

      {/* Tabela de dias */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Ritmo Diário Recalculado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Data', 'Dia', 'Índice', 'Meta Recalculada', 'Venda Realizada', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {painel.dias.map(d => (
                <tr key={d.data} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{d.data}</td>
                  <td className="px-4 py-2 text-gray-600">{d.dia_semana}</td>
                  <td className="px-4 py-2 text-gray-600">{d.indice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-800">{d.meta_recalculada > 0 ? BRL(d.meta_recalculada) : '—'}</td>
                  <td className="px-4 py-2 text-gray-800">{d.venda_realizada > 0 ? BRL(d.venda_realizada) : '—'}</td>
                  <td className="px-4 py-2">{STATUS_LABEL[d.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, sub, highlight }: {
  label: string
  value: string
  sub?: string
  highlight?: 'red' | 'yellow' | 'green'
}) {
  const color = highlight === 'red' ? 'text-red-600' : highlight === 'yellow' ? 'text-yellow-600' : highlight === 'green' ? 'text-green-600' : 'text-gray-800'
  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
