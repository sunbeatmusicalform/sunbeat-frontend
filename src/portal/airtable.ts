/* Camada de dados do Sunbeat Tables.
   Tenta a fonte real (endpoint do backend Sunbeat, que lê Supabase + Airtable
   server-side — o Airtable API não aceita CORS direto do navegador com PAT).
   Sem backend configurado no protótipo, cai no mock local com selo de demo.

   Configuração via env:
     VITE_TABLES_API_URL — ex.: https://api.sunbeat.pro/workspaces/atabaque/tables
*/

import { TABLE_ROWS, type TableRow } from './data'

export interface TablesResult {
  rows: TableRow[]
  source: 'airtable' | 'demo'
  fetchedAt: string
}

const API_URL = import.meta.env.VITE_TABLES_API_URL as string | undefined

export async function fetchTableRows(): Promise<TablesResult> {
  const fetchedAt = new Date().toISOString()
  if (!API_URL) return { rows: TABLE_ROWS, source: 'demo', fetchedAt }
  try {
    const res = await fetch(`${API_URL}?workspace=atabaque`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return { rows: json.rows as TableRow[], source: 'airtable', fetchedAt }
  } catch (err) {
    console.warn('[tables] falha na fonte real, usando demo:', err)
    return { rows: TABLE_ROWS, source: 'demo', fetchedAt }
  }
}
