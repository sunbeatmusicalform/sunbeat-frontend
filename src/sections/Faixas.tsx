import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileAudio, Loader2, Music2, Plus, Star, Trash2 } from 'lucide-react'
import { Field, StepHeader, inputCls } from './ui'
import { analyzeWav, fieldErrors, type AudioReport, type useIntakeForm } from '@/hooks/useIntakeForm'

type F = ReturnType<typeof useIntakeForm>

function TrackCard({ form, index, showErrors }: { form: F; index: number; showErrors: boolean }) {
  const track = form.data.tracks[index]
  const all = showErrors ? fieldErrors('faixas', form.data) : {}
  const p = `t${index}.`
  const [audio, setAudio] = useState<AudioReport | null>(null)
  const [checking, setChecking] = useState(false)

  async function onAudio(file: File | undefined) {
    if (!file) return
    form.setAudioFile(track.id, file)
    setChecking(true)
    try { setAudio(await analyzeWav(file)) } catch { setAudio(null) }
    setChecking(false)
  }

  return (
    <div className={`sun-card rounded-3xl p-5 md:p-6 ${track.isFocus ? 'ring-2 ring-secondary' : ''}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-black text-sm">
            {index + 1}
          </span>
          <span className="font-bold">{track.title || `Faixa ${index + 1}`}</span>
          {track.isFocus && <Badge className="bg-secondary text-secondary-foreground">⭐ Faixa foco</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" title="Marcar como faixa foco"
            onClick={() => form.setFocusTrack(track.id)}>
            <Star className={`h-4 w-4 ${track.isFocus ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`} />
          </Button>
          {form.data.tracks.length > 1 && (
            <Button type="button" variant="ghost" size="icon" title="Remover faixa"
              onClick={() => form.removeTrack(track.id)}>
              <Trash2 className="h-4 w-4 text-accent" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome da faixa" required error={all[p + 'title']}>
            <Input className={inputCls(!!all[p + 'title'])} placeholder="Título da música"
              value={track.title} onChange={(ev) => form.setTrack(track.id, { title: ev.target.value })} />
          </Field>
          <Field label="Artistas principais" required error={all[p + 'mainArtists']}
            hint="Exatamente como aparecem nas plataformas. Separe com vírgula.">
            <Input className={inputCls(!!all[p + 'mainArtists'])} placeholder="Ex.: Alaíde Tropical"
              value={track.mainArtists} onChange={(ev) => form.setTrack(track.id, { mainArtists: ev.target.value })} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Participações (feats)" hint="Deixe em branco se não houver.">
            <Input className={inputCls()} placeholder="Ex.: Zé Raminho"
              value={track.featArtists} onChange={(ev) => form.setTrack(track.id, { featArtists: ev.target.value })} />
          </Field>
          <Field label="Compositores e autores" required error={all[p + 'composers']}
            hint="Necessário para o registro do ISRC e créditos editoriais.">
            <Input className={inputCls(!!all[p + 'composers'])} placeholder="Nome completo de cada autor"
              value={track.composers} onChange={(ev) => form.setTrack(track.id, { composers: ev.target.value })} />
          </Field>
        </div>

        <Field label="Intérpretes" hint="Quem executa a gravação — usado nos créditos do cadastro do ISRC.">
          <Input className={inputCls()} placeholder="Ex.: Alaíde Tropical"
            value={track.performers} onChange={(ev) => form.setTrack(track.id, { performers: ev.target.value })} />
        </Field>

        <Field label="A música já tem ISRC?" required error={all[p + 'hasISRC']}
          hint="ISRC é o código internacional da gravação. Se a faixa nunca foi lançada, provavelmente ainda não tem — e nós geramos para você.">
          <RadioGroup className="flex gap-3" value={track.hasISRC}
            onValueChange={(v) => form.setTrack(track.id, { hasISRC: v as 'yes' | 'no' })}>
            {[['yes', 'Sim, já tem'], ['no', 'Não, gerar para mim']].map(([v, t]) => (
              <Label key={v} htmlFor={`${track.id}-isrc-${v}`}
                className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${track.hasISRC === v ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                <RadioGroupItem value={v} id={`${track.id}-isrc-${v}`} className="sr-only" />{t}
              </Label>
            ))}
          </RadioGroup>
        </Field>

        {track.hasISRC === 'yes' && (
          <Field label="Código ISRC" required error={all[p + 'isrc']} hint="Ex.: BRABC2600001">
            <Input className={inputCls(!!all[p + 'isrc'])} placeholder="BR___0000000" maxLength={12}
              value={track.isrc} onChange={(ev) => form.setTrack(track.id, { isrc: ev.target.value.toUpperCase() })} />
          </Field>
        )}

        <Field label="Produtor fonográfico" required error={all[p + 'producer']}
          hint="Pessoa ou estúdio responsável pela gravação — obrigatório com ou sem ISRC.">
          <Input className={inputCls(!!all[p + 'producer'])} placeholder="Ex.: Estúdio Pedra Selva"
            value={track.producer} onChange={(ev) => form.setTrack(track.id, { producer: ev.target.value })} />
        </Field>

        <Field label="Perfis de artista" hint="Se algum artista ainda não tem perfil nas plataformas, escreva o nome exato do perfil a criar. Se já tem, cole os links.">
          <Textarea className={inputCls()} rows={2}
            placeholder="Criar perfil: NOME DO ARTISTA&#10;Links: https://open.spotify.com/artist/..."
            value={track.newArtistProfiles}
            onChange={(ev) => form.setTrack(track.id, { newArtistProfiles: ev.target.value })} />
        </Field>

        <Field label="Áudio da faixa" required error={all[p + 'audio']}
          hint="Master em WAV (44.1 kHz / 16 bits ou superior). Analisamos o arquivo automaticamente.">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-foreground/25 bg-white/50 p-4 transition-colors hover:border-accent hover:bg-accent/5">
            <input type="file" accept="audio/*,.wav" className="sr-only" onChange={(ev) => onAudio(ev.target.files?.[0])} />
            {checking ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <FileAudio className="h-5 w-5 text-accent" />}
            <span className="text-sm font-semibold">{track.audioFileName ?? 'Clique para anexar o áudio'}</span>
          </label>
          {audio && (
            <div className={`mt-3 rounded-xl border-2 p-3 text-xs leading-relaxed ${audio.ok ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-accent/50 bg-accent/10'}`}>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className={`h-4 w-4 ${audio.ok ? 'text-emerald-600' : 'text-accent'}`} />
                Análise do áudio — {audio.duration} min · {audio.sampleRate} Hz · {audio.bitDepth} bits · {audio.channels === 2 ? 'estéreo' : `${audio.channels} canal(is)`}
              </div>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {audio.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          )}
        </Field>
      </div>
    </div>
  )
}

export function Faixas({ form, showErrors }: { form: F; showErrors: boolean }) {
  const all = showErrors ? fieldErrors('faixas', form.data) : {}
  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title="Faixas e créditos"
        description="Cadastre cada música com seus créditos. Capriche aqui: é desses dados que saem o ISRC, os créditos nas plataformas e a distribuição."
      />
      {all.focusTrack && (
        <p className="mb-4 rounded-xl border-2 border-accent/50 bg-accent/10 p-3 text-xs font-semibold text-accent">
          {all.focusTrack}
        </p>
      )}
      <div className="space-y-6">
        {form.data.tracks.map((_, i) => (
          <TrackCard key={form.data.tracks[i].id} form={form} index={i} showErrors={showErrors} />
        ))}
      </div>
      <Button type="button" variant="outline"
        className="mt-6 w-full rounded-2xl border-2 border-dashed border-foreground/30 bg-transparent h-14 font-bold hover:border-accent hover:bg-accent/5"
        onClick={form.addTrack}>
        <Plus className="mr-1 h-5 w-5" /> Adicionar outra faixa
      </Button>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Music2 className="h-3.5 w-3.5" /> Marque com ⭐ a faixa foco — ela guia o plano de divulgação.
      </p>
    </div>
  )
}
