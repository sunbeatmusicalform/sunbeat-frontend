import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, CheckCheck, Clock3, Download, Loader2, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TimedLyricLine } from '@/types/intake'

interface AlignmentResponse {
  ok: boolean
  provider: string
  model: string
  lines: TimedLyricLine[]
  duration_ms?: number | null
}

async function alignLyrics(args: { audio: File; lyrics: string; workspaceSlug: string }): Promise<AlignmentResponse> {
  const body = new FormData()
  body.append('workspace_slug', args.workspaceSlug)
  body.append('lyrics', args.lyrics)
  body.append('consent_ai_processing', 'true')
  body.append('audio', args.audio)
  const response = await fetch('/lyrics/align', { method: 'POST', body })
  if (!response.ok) {
    let detail = 'Não foi possível gerar a sincronização.'
    try {
      const payload = await response.json() as { detail?: string }
      if (payload.detail) detail = payload.detail
    } catch { /* respostas sem JSON usam a mensagem segura padrão */ }
    throw new Error(detail)
  }
  return response.json() as Promise<AlignmentResponse>
}

function milliseconds(value: string): number | null {
  const seconds = Number(value.replace(',', '.'))
  return Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds * 1000) : null
}

function seconds(value: number | null): string {
  return value === null ? '' : (value / 1000).toFixed(2)
}

function lrcTime(millisecondsValue: number): string {
  const totalHundredths = Math.max(0, Math.round(millisecondsValue / 10))
  const minutes = Math.floor(totalHundredths / 6000)
  const secondsValue = Math.floor((totalHundredths % 6000) / 100)
  const hundredths = totalHundredths % 100
  return `${String(minutes).padStart(2, '0')}:${String(secondsValue).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

function ttmlTime(millisecondsValue: number): string {
  const hours = Math.floor(millisecondsValue / 3_600_000)
  const minutes = Math.floor((millisecondsValue % 3_600_000) / 60_000)
  const secondsValue = Math.floor((millisecondsValue % 60_000) / 1000)
  const millis = millisecondsValue % 1000
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondsValue).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function safeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'letra'
}

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function LyricsSyncEditor({
  audioFile,
  lyrics,
  lines,
  title,
  artist,
  workspaceSlug,
  heading,
  description,
  generateLabel,
  onChange,
}: {
  audioFile?: File
  lyrics: string
  lines: TimedLyricLine[]
  title: string
  artist: string
  workspaceSlug: string
  heading: string
  description: string
  generateLabel: string
  onChange: (lines: TimedLyricLine[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioFile) { setAudioUrl(null); return }
    const url = URL.createObjectURL(audioFile)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audioFile])

  function updateLine(id: string, patch: Partial<TimedLyricLine>) {
    onChange(lines.map((line) => line.id === id ? { ...line, ...patch, needs_review: true } : line))
  }

  function mark(id: string, field: 'start_ms' | 'end_ms') {
    if (!audioRef.current) return
    const value = Math.round(audioRef.current.currentTime * 1000)
    updateLine(id, { [field]: value, status: 'timed' })
  }

  async function generate() {
    if (!audioFile || !lyrics.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await alignLyrics({ audio: audioFile, lyrics, workspaceSlug })
      onChange(result.lines)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível gerar a sincronização.')
    } finally {
      setLoading(false)
    }
  }

  function exportLrc() {
    const timed = lines.filter((line) => line.start_ms !== null).sort((a, b) => (a.start_ms ?? 0) - (b.start_ms ?? 0))
    const content = [`[ti:${title || 'Sem título'}]`, `[ar:${artist || 'Artista'}]`, '', ...timed.map((line) => `[${lrcTime(line.start_ms!)}]${line.text}`)].join('\n')
    download(`${safeName(title)}.lrc`, content, 'text/plain;charset=utf-8')
  }

  function exportTtml() {
    const timed = lines.filter((line) => line.start_ms !== null && line.end_ms !== null)
    const paragraphs = timed.map((line) => `        <p begin="${ttmlTime(line.start_ms!)}" end="${ttmlTime(line.end_ms!)}">${xml(line.text)}</p>`).join('\n')
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n<tt xmlns="http://www.w3.org/ns/ttml" xml:lang="pt-BR">\n  <head><metadata><title>${xml(title || 'Sem título')}</title></metadata></head>\n  <body>\n    <div>\n${paragraphs}\n    </div>\n  </body>\n</tt>\n`
    download(`${safeName(title)}.ttml`, content, 'application/ttml+xml;charset=utf-8')
  }

  const ready = Boolean(audioFile && lyrics.trim())
  const exportable = lines.some((line) => line.start_ms !== null)
  const pendingReview = lines.filter((line) => line.needs_review).length

  return (
    <div className="rounded-2xl border border-foreground/15 bg-white/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-accent" /> {heading}</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={!ready || loading} onClick={generate}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {lines.length ? 'Gerar novamente' : generateLabel}
        </Button>
      </div>

      {!ready && <p className="mt-3 text-xs font-medium text-muted-foreground">Anexe o áudio e cole a letra para habilitar a sincronização.</p>}
      {error && <p className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}

      {lines.length > 0 && audioUrl && (
        <div className="mt-4 space-y-3">
          <audio ref={audioRef} src={audioUrl} controls className="w-full" />
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {lines.map((line) => (
              <div key={line.id} className={`rounded-xl border p-3 ${line.needs_review ? 'border-amber-500/45 bg-amber-50/60' : 'border-foreground/10 bg-white/60'}`}>
                <button type="button" className="flex w-full items-center gap-2 text-left text-sm font-semibold" onClick={() => {
                  if (audioRef.current && line.start_ms !== null) { audioRef.current.currentTime = line.start_ms / 1000; void audioRef.current.play() }
                }}>
                  <Play className="h-3.5 w-3.5 shrink-0" /> {line.text}
                </button>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
                  <Input aria-label={`Início de ${line.text}`} inputMode="decimal" placeholder="Início (s)" value={seconds(line.start_ms)} onChange={(event) => updateLine(line.id, { start_ms: milliseconds(event.target.value), status: 'timed' })} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => mark(line.id, 'start_ms')}><Clock3 className="mr-1 h-3.5 w-3.5" /> Marcar início</Button>
                  <Input aria-label={`Fim de ${line.text}`} inputMode="decimal" placeholder="Fim (s)" value={seconds(line.end_ms)} onChange={(event) => updateLine(line.id, { end_ms: milliseconds(event.target.value), status: 'timed' })} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => mark(line.id, 'end_ms')}><Clock3 className="mr-1 h-3.5 w-3.5" /> Marcar fim</Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Confiança inicial: {Math.round(line.confidence * 100)}%{line.needs_review ? ' · revisar' : ''}</p>
                <Button type="button" size="sm" variant="ghost" className="mt-1" disabled={line.start_ms === null || line.end_ms === null || !line.needs_review}
                  onClick={() => onChange(lines.map((item) => item.id === line.id ? { ...item, needs_review: false } : item))}>
                  <Check className="mr-1 h-3.5 w-3.5" /> {line.needs_review ? 'Validar linha' : 'Linha validada'}
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Button type="button" size="sm" variant="ghost" disabled={!lines.some((line) => line.start_ms !== null && line.end_ms !== null && line.needs_review)}
              onClick={() => onChange(lines.map((line) => line.start_ms !== null && line.end_ms !== null ? { ...line, needs_review: false } : line))}>
              <CheckCheck className="mr-1 h-4 w-4" /> Validar todas com tempo
            </Button>
            <span>{pendingReview ? `${pendingReview} linha(s) ainda precisam de revisão.` : 'Todas as linhas com tempo foram validadas.'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!exportable} onClick={exportLrc}><Download className="mr-2 h-4 w-4" /> Exportar LRC</Button>
            <Button type="button" variant="outline" disabled={!exportable} onClick={exportTtml}><Download className="mr-2 h-4 w-4" /> Exportar TTML</Button>
          </div>
        </div>
      )}
    </div>
  )
}
