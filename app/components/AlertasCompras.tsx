'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularAlertas } from '@/utils/alertas'
import { AlertaCompra, CompraAndamento, VendaDiaria } from '@/types'

const HOJE = '2026-06-18'

const CLS: Record<string, { badge: string; label: string }> = {
  critico: { badge: '🔴', label: 'Crítico' },
  atencao: { badge: '🟡', label: 'Atenção' },
  ok:      { badge: '🟢', label: 'OK' },
}

export default function AlertasCompras() {
  const [alertas, setAlertas] = useState<AlertaCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      try {
        const [{ data: compras, error: e1 }, { data: vendas, error: e2 }] = await Promise.all([
          supabase.from('sim_compras_andamento').select('*'),
          supabase.from('sim_venda_diaria').select('*'),
        ])
        if (e1 || e2) throw new Error(e1?.message || e2?.message)
        setAlertas(calcularAlertas(
          (compras || []) as CompraAndamento[],
          (vendas || []) as VendaDiaria[],
          HOJE
        ))
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>
  if (erro) return <p className="text-sm text-red-600">Erro: {erro}</p>

  const criticos = alertas.filter(a => a.classificacao === 'critico').length
  const atencao  = alertas.filter(a => a.classificacao === 'atencao').length
  const ok       = alertas.filter(a => a.classificacao === 'ok').length

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-800">Compras em Andamento</h1>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Críticos', value: criticos, color: 'text-red-600' },
          { label: 'Atenção',  value: atencao,  color: 'text-yellow-600' },
          { label: 'OK',       value: ok,        color: 'text-green-600' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Fornecedor', 'Categoria', 'Espécie', 'Qtd (un)', 'Entrega', 'Ritmo Esp.', 'Ritmo Real', 'Desvio', 'Status', 'Ação'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alertas.map(a => (
              <tr key={a.id_compra} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{a.id_compra}</td>
                <td className="px-3 py-2 text-gray-800">{a.fornecedor}</td>
                <td className="px-3 py-2 text-gray-600">{a.categoria}</td>
                <td className="px-3 py-2 text-gray-600">{a.especie || '—'}</td>
                <td className="px-3 py-2 text-gray-800">{a.quantidade_un.toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{a.data_entrega}</td>
                <td className="px-3 py-2 text-gray-600">{a.ritmo_esperado.toFixed(1)}/dia</td>
                <td className="px-3 py-2 text-gray-600">{a.ritmo_real.toFixed(1)}/dia</td>
                <td className={`px-3 py-2 font-semibold ${a.desvio_pct < -30 ? 'text-red-600' : a.desvio_pct < -10 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {a.desvio_pct >= 0 ? '+' : ''}{a.desvio_pct.toFixed(1)}%
                </td>
                <td className="px-3 py-2">
                  <span className="text-base">{CLS[a.classificacao].badge}</span>
                  <span className="ml-1 text-xs text-gray-500">{CLS[a.classificacao].label}</span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{a.acao_recomendada}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
