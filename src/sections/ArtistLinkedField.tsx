import { useEffect, useMemo, useState } from 'react'
import { Check, ExternalLink, Link2, Loader2, Plus, Search, UserPlus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { api, type PeopleLookupItem } from '@/lib/api'
import type { ArtistReference } from '@/types/intake'

interface Props {
  workspaceSlug: string
  value: string
  references: ArtistReference[]
  onChange: (value: string, references: ArtistReference[]) => void
  error?: string
  label?: string
  hint?: string
  placeholder?: string
  required?: boolean
}

function registrationUrl(workspace: string, name: string) {
  const params = new URLSearchParams({ name, role: 'artista', from: 'intake' })
  return `/people/${encodeURIComponent(workspace)}?${params}`
}

export function ArtistLinkedField({ workspaceSlug, value, references, onChange, error, label = 'Artistas vinculados', hint = 'Busque no cadastro da Atabaque. Use vírgula ou Enter para conferir um nome novo.', placeholder = 'Digite o nome artístico…', required = false }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PeopleLookupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  const effective = useMemo<ArtistReference[]>(() => {
    if (references.length) return references
    return value.split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({
      id: null,
      name,
      status: 'unregistered' as const,
    }))
  }, [references, value])

  useEffect(() => {
    const clean = query.trim()
    if (clean.length < 2) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const response = await api.lookupArtists(clean, workspaceSlug)
      if (!cancelled) {
        setResults(response?.items ?? [])
        setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, workspaceSlug])

  function commit(next: ArtistReference[]) {
    onChange(next.map((item) => item.name).join(', '), next)
    setQuery('')
    setResults([])
  }

  function addRegistered(item: PeopleLookupItem) {
    if (effective.some((artist) => artist.id === item.id || artist.name.toLowerCase() === item.displayName.toLowerCase())) return
    commit([...effective, { id: item.id, name: item.displayName, status: 'registered', source: 'people_registry' }])
  }

  async function addTypedName() {
    const name = query.trim().replace(/,$/, '').trim()
    if (!name || effective.some((artist) => artist.name.toLowerCase() === name.toLowerCase())) return
    setChecking(true)
    const verified = await api.verifyPerson(name, workspaceSlug)
    const match = verified?.v2_pessoas ?? verified?.dados_cadastrais
    const isRegistered = verified && verified.verdict !== 'nao_encontrado' && match
    commit([...effective, isRegistered ? {
      id: match.record_id,
      name: match.display_name || name,
      status: 'registered',
      source: verified.v2_pessoas ? 'v2_pessoas' : 'dados_cadastrais',
    } : { id: null, name, status: 'unregistered' }])
    setChecking(false)
  }

  function remove(index: number) {
    commit(effective.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className={`rounded-2xl border-2 bg-white/55 p-4 ${error ? 'border-accent' : 'border-foreground/15'}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold"><Link2 className="h-4 w-4 text-[#329fd7]" /> {label}{required ? <span className="text-accent">*</span> : null}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="rounded-full bg-[#329fd7]/12 px-2 py-1 text-[10px] font-bold text-[#1f6f9e]">cadastro vinculado</span>
      </div>

      {effective.length > 0 && (
        <div className="mb-3 space-y-2">
          {effective.map((artist, index) => (
            <div key={`${artist.id ?? artist.name}-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-foreground/10 bg-background/70 px-3 py-2">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${artist.status === 'registered' ? 'bg-emerald-600 text-white' : 'bg-secondary text-secondary-foreground'}`}>
                {artist.status === 'registered' ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{artist.name}</span>
              {artist.status === 'registered' ? (
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">cadastrado</span>
              ) : (
                <a href={registrationUrl(workspaceSlug, artist.name)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-secondary/25 px-2.5 py-1 text-[10px] font-bold text-foreground hover:bg-secondary/40">
                  Abrir cadastro <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button type="button" aria-label={`Remover ${artist.name}`} onClick={() => remove(index)} className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              void addTypedName()
            }
          }}
          className="h-11 pl-9 pr-24"
          placeholder={placeholder}
        />
        <button type="button" disabled={!query.trim() || checking} onClick={() => void addTypedName()} className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-full bg-foreground px-2.5 text-[11px] font-bold text-background disabled:opacity-30">
          {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Adicionar
        </button>
      </div>

      {query.trim().length >= 2 && (loading || results.length > 0) && (
        <div className="mt-2 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm">
          {loading ? <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando cadastros…</p> : results.map((item) => (
            <button type="button" key={item.id} onClick={() => addRegistered(item)} className="flex w-full items-center gap-2 border-b border-foreground/8 px-3 py-2 text-left last:border-0 hover:bg-[#329fd7]/8">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="flex-1 text-sm font-semibold">{item.displayName}</span>
              <span className="text-[10px] text-muted-foreground">{item.confidence === 'exact' ? 'nome exato' : 'possível match'}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-accent">{error}</p>}
    </div>
  )
}
