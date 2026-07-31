import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, ImagePlus, Loader2 } from 'lucide-react'
import { Field, StepHeader, inputCls } from './ui'
import { analyzeCover, fieldErrors, type CoverReport, type useIntakeForm } from '@/hooks/useIntakeForm'
import { GENRES } from '@/types/intake'
import { AssetStandardsPanel } from './AssetStandardsPanel'

type F = ReturnType<typeof useIntakeForm>

export function Projeto({ form, showErrors }: { form: F; showErrors: boolean }) {
  const e = showErrors ? fieldErrors('projeto', form.data) : {}
  const [cover, setCover] = useState<CoverReport | null>(null)
  const [checking, setChecking] = useState(false)

  async function onCover(file: File | undefined) {
    if (!file) return
    form.setCoverFile(file)
    setChecking(true)
    try { setCover(await analyzeCover(file)) } catch { setCover(null) }
    setChecking(false)
  }

  return (
    <div className="mx-auto max-w-xl">
      <StepHeader
        title="Sobre o projeto"
        description="O essencial do lançamento: nome, formato, data e identidade. A partir da data, montamos o cronograma de distribuição."
      />
      <div className="space-y-6">
        <Field label="Nome do projeto" required error={e.projectName}
          hint="Título do single, EP ou álbum como deve aparecer nas plataformas.">
          <Input className={inputCls(!!e.projectName)} placeholder="Ex.: Ciranda Elétrica"
            value={form.data.projectName} onChange={(ev) => form.setData('projectName', ev.target.value)} />
        </Field>

        <Field label="Tipo de lançamento" required error={e.releaseType}>
          <RadioGroup
            className="grid grid-cols-3 gap-3"
            value={form.data.releaseType}
            onValueChange={(v) => form.setData('releaseType', v as typeof form.data.releaseType)}
          >
            {[['single', 'Single', '1 faixa'], ['ep', 'EP', '2 a 6 faixas'], ['album', 'Álbum', '7+ faixas']].map(([v, t, d]) => (
              <Label key={v} htmlFor={`rt-${v}`}
                className={`cursor-pointer rounded-2xl border-2 p-3 text-center transition-all ${form.data.releaseType === v ? 'border-accent bg-accent/10 shadow-[3px_3px_0_0_rgba(255,86,57,0.3)]' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                <RadioGroupItem value={v} id={`rt-${v}`} className="sr-only" />
                <div className="font-bold">{t}</div>
                <div className="text-xs text-muted-foreground">{d}</div>
              </Label>
            ))}
          </RadioGroup>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Data de lançamento" required error={e.releaseDate}
            hint="Recomendamos pelo menos 21 dias de antecedência.">
            <Input type="date" className={inputCls(!!e.releaseDate)}
              value={form.data.releaseDate} onChange={(ev) => form.setData('releaseDate', ev.target.value)} />
          </Field>
          <Field label="Gênero musical" required error={e.genre}>
            <Select value={form.data.genre} onValueChange={(v) => form.setData('genre', v)}>
              <SelectTrigger className={inputCls(!!e.genre)}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Capa do lançamento" error={undefined}
          hint="Quadrada, mínimo 1500×1500 px (ideal 3000×3000). Analisamos o arquivo na hora.">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-foreground/25 bg-white/50 p-6 text-center transition-colors hover:border-accent hover:bg-accent/5">
            <input type="file" accept=".jpg,.jpeg,.png,.tif,.tiff,image/jpeg,image/png,image/tiff" className="sr-only" onChange={(ev) => onCover(ev.target.files?.[0])} />
            {checking ? <Loader2 className="h-6 w-6 animate-spin text-accent" /> : <ImagePlus className="h-6 w-6 text-accent" />}
            <span className="text-sm font-semibold">{form.data.coverFileName ?? 'Clique para enviar a capa'}</span>
            <span className="text-xs text-muted-foreground">JPG, PNG ou TIFF · até 100 MB</span>
          </label>
          {cover && (
            <div className={`mt-3 rounded-xl border-2 p-3 text-xs leading-relaxed ${cover.ok ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-accent/50 bg-accent/10'}`}>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className={`h-4 w-4 ${cover.ok ? 'text-emerald-600' : 'text-accent'}`} />
                Análise da capa — {cover.format} · {cover.width || 'dimensão não lida'}{cover.width ? ` × ${cover.height} px` : ''} · {cover.sizeMb.toFixed(1)} MB
              </div>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {cover.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {cover.standards.map((standard) => <div key={standard.label} className="rounded-lg bg-white/55 px-2.5 py-2">
                  <p className="font-bold">{standard.status === 'ok' ? '✓' : standard.status === 'warning' ? '◐' : '×'} {standard.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{standard.detail}</p>
                </div>)}
              </div>
            </div>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Link do vídeo (opcional)" error={e.videoLink}
            hint="Clipe, visualizer ou lyric video já publicado ou agendado.">
            <Input className={inputCls(!!e.videoLink)} placeholder="https://youtube.com/..."
              value={form.data.videoLink} onChange={(ev) => form.setData('videoLink', ev.target.value)} />
          </Field>
          <Field label="Data do vídeo (opcional)">
            <Input type="date" className={inputCls()}
              value={form.data.videoDate} onChange={(ev) => form.setData('videoDate', ev.target.value)} />
          </Field>
        </div>

        <Field label="Link do kit visual (opcional)" error={e.additionalFiles}
          hint="Pasta com thumbs, cabeçalhos, banners, fotos e demais peças de divulgação.">
          <Input className={inputCls(!!e.additionalFiles)} placeholder="https://drive.google.com/..."
            value={form.data.additionalFiles ?? ''} onChange={(ev) => form.setData('additionalFiles', ev.target.value)} />
        </Field>

        <AssetStandardsPanel />

        <Field label="Observações do projeto (opcional)"
          hint="Contexto, referências, restrições de datas, territórios — qualquer coisa que ajude a equipe.">
          <Textarea className={inputCls()} rows={3} placeholder="Conte pra gente..."
            value={form.data.notes} onChange={(ev) => form.setData('notes', ev.target.value)} />
        </Field>
      </div>
    </div>
  )
}
