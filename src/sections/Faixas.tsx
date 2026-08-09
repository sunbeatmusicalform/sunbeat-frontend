import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileAudio, Loader2, Music2, Plus, Star, Trash2 } from 'lucide-react'
import { Field, StepHeader, inputCls } from './ui'
import { analyzeWav, type AudioReport, type useIntakeForm } from '@/hooks/useIntakeForm'
import { ArtistLinkedField } from './ArtistLinkedField'
import { LyricsSyncEditor } from './LyricsSyncEditor'

type F = ReturnType<typeof useIntakeForm>

function TrackCard({ form, index, showErrors, workspaceSlug }: { form: F; index: number; showErrors: boolean; workspaceSlug: string }) {
  const track = form.data.tracks[index]
  const all = showErrors ? form.errorsFor('faixas') : {}
  const p = `t${index}.`
  const [audio, setAudio] = useState<AudioReport | null>(null)
  const [checking, setChecking] = useState(false)
  const isSingle = form.data.releaseType === 'single'

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
          {form.isVisible('focusTrack') && !isSingle ? <Button type="button" variant="ghost" size="icon" title="Marcar como faixa foco"
            onClick={() => form.setFocusTrack(track.id)}>
            <Star className={`h-4 w-4 ${track.isFocus ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`} />
          </Button> : null}
          {form.data.tracks.length > 1 && (
            <Button type="button" variant="ghost" size="icon" title="Remover faixa"
              onClick={() => form.removeTrack(track.id)}>
              <Trash2 className="h-4 w-4 text-accent" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        {form.isVisible('track.title') ? <Field label={form.textFor('track.title', 'label', 'Nome da faixa')} required={form.isRequired('track.title')} error={all[p + 'title']}>
            <Input className={inputCls(!!all[p + 'title'])} placeholder={form.textFor('track.title', 'placeholder', 'Título da música')}
              value={track.title} onChange={(ev) => form.setTrack(track.id, { title: ev.target.value })} />
        </Field> : null}

        {form.isVisible('track.mainArtists') ? <ArtistLinkedField
          workspaceSlug={workspaceSlug}
          value={track.mainArtists}
          references={track.mainArtistRefs ?? []}
          error={all[p + 'mainArtists']}
          label={form.textFor('track.mainArtists', 'label', 'Artistas principais')}
          hint={form.textFor('track.mainArtists', 'hint', 'Busque no cadastro do workspace. Use vírgula ou Enter para conferir um nome novo.')}
          placeholder={form.textFor('track.mainArtists', 'placeholder', 'Digite o nome artístico…')}
          required={form.isRequired('track.mainArtists')}
          onChange={(mainArtists, mainArtistRefs) => form.setTrack(track.id, { mainArtists, mainArtistRefs })}
        /> : null}

        {(form.isVisible('track.featArtists') || form.isVisible('track.composers') || form.isVisible('track.performers')) ? (
          <section className="rounded-2xl border border-foreground/15 bg-card/35 p-4 md:p-5">
            <div className="mb-4">
              <h4 className="text-sm font-bold">Créditos e participações</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Informe um nome por linha. Assim a equipe consegue revisar todos os créditos sem nomes cortados.</p>
            </div>
            <div className="grid items-stretch gap-5 lg:grid-cols-2">
              {form.isVisible('track.featArtists') ? <Field className="flex h-full flex-col gap-1.5 space-y-0" label={form.textFor('track.featArtists', 'label', 'Participações (feats)')} required={form.isRequired('track.featArtists')} error={all[p + 'featArtists']} hint={form.textFor('track.featArtists', 'hint', 'Informe um nome por linha. Deixe em branco se não houver.')}>
                <Textarea rows={4} className={`${inputCls(!!all[p + 'featArtists'])} mt-auto resize-y`} placeholder={form.textFor('track.featArtists', 'placeholder', 'Ex.: Zé Raminho\nEx.: Convidada Silva')}
                  value={track.featArtists} onChange={(ev) => form.setTrack(track.id, { featArtists: ev.target.value })} />
              </Field> : null}
              {form.isVisible('track.composers') ? <Field className="flex h-full flex-col gap-1.5 space-y-0" label={form.textFor('track.composers', 'label', 'Compositores e autores')} required={form.isRequired('track.composers')} error={all[p + 'composers']}
                hint={form.textFor('track.composers', 'hint', 'Informe o nome completo de cada compositor ou autor, um por linha.')}>
                <Textarea rows={4} className={`${inputCls(!!all[p + 'composers'])} mt-auto resize-y`} placeholder={form.textFor('track.composers', 'placeholder', 'Nome completo do autor 1\nNome completo do autor 2')}
                  value={track.composers} onChange={(ev) => form.setTrack(track.id, { composers: ev.target.value })} />
              </Field> : null}
              {form.isVisible('track.performers') ? <Field className="flex h-full flex-col gap-1.5 space-y-0 lg:col-span-2" label={form.textFor('track.performers', 'label', 'Intérpretes')} required={form.isRequired('track.performers')} error={all[p + 'performers']} hint={form.textFor('track.performers', 'hint', 'Informe um nome por linha para quem executa a gravação.')}>
                <Textarea rows={3} className={`${inputCls(!!all[p + 'performers'])} resize-y`} placeholder={form.textFor('track.performers', 'placeholder', 'Ex.: Alaíde Tropical\nEx.: Músico Convidado')}
                  value={track.performers} onChange={(ev) => form.setTrack(track.id, { performers: ev.target.value })} />
              </Field> : null}
            </div>
          </section>
        ) : null}

        {form.isVisible('track.hasISRC') ? <Field label={form.textFor('track.hasISRC', 'label', 'A música já tem ISRC?')} required={form.isRequired('track.hasISRC')} error={all[p + 'hasISRC']}
          hint={form.textFor('track.hasISRC', 'hint', 'ISRC é o código internacional da gravação. Se a faixa nunca foi lançada, provavelmente ainda não tem — e nós geramos para você.')}>
          <RadioGroup className="flex gap-3" value={track.hasISRC}
            onValueChange={(v) => form.setTrack(track.id, { hasISRC: v as 'yes' | 'no' })}>
            {[['yes', 'Sim, já tem'], ['no', 'Não, gerar para mim']].map(([v, t]) => (
              <Label key={v} htmlFor={`${track.id}-isrc-${v}`}
                className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${track.hasISRC === v ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-card/60 hover:border-foreground/30'}`}>
                <RadioGroupItem value={v} id={`${track.id}-isrc-${v}`} className="sr-only" />{t}
              </Label>
            ))}
          </RadioGroup>
        </Field> : null}

        {form.isVisible('track.isrc') && track.hasISRC === 'yes' ? (
          <Field label={form.textFor('track.isrc', 'label', 'Código ISRC')} required={form.isRequired('track.isrc')} error={all[p + 'isrc']} hint={form.textFor('track.isrc', 'hint', 'Ex.: BRABC2600001')}>
            <Input className={inputCls(!!all[p + 'isrc'])} placeholder={form.textFor('track.isrc', 'placeholder', 'BR___0000000')} maxLength={12}
              value={track.isrc} onChange={(ev) => form.setTrack(track.id, { isrc: ev.target.value.toUpperCase() })} />
          </Field>
        ) : null}

        {form.isVisible('track.producer') ? <Field label={form.textFor('track.producer', 'label', 'Produtor fonográfico')} required={form.isRequired('track.producer')} error={all[p + 'producer']}
          hint={form.textFor('track.producer', 'hint', 'Pessoa ou estúdio responsável pela gravação — obrigatório com ou sem ISRC.')}>
          <Input className={inputCls(!!all[p + 'producer'])} placeholder={form.textFor('track.producer', 'placeholder', 'Ex.: Estúdio Pedra Selva')}
            value={track.producer} onChange={(ev) => form.setTrack(track.id, { producer: ev.target.value })} />
        </Field> : null}

        {form.isVisible('track.profiles') ? <Field label={form.textFor('track.profiles', 'label', 'Perfis de artista')} required={form.isRequired('track.profiles')} error={all[p + 'profiles']} hint={form.textFor('track.profiles', 'hint', 'Se algum artista ainda não tem perfil nas plataformas, escreva o nome exato do perfil a criar. Se já tem, cole os links.')}>
          <Textarea className={inputCls(!!all[p + 'profiles'])} rows={2}
            placeholder={form.textFor('track.profiles', 'placeholder', 'Criar perfil: NOME DO ARTISTA\nLinks: https://open.spotify.com/artist/...')}
            value={track.newArtistProfiles}
            onChange={(ev) => form.setTrack(track.id, { newArtistProfiles: ev.target.value })} />
        </Field> : null}

        {form.isVisible('track.lyrics') ? <Field label={form.textFor('track.lyrics', 'label', 'Letra da música')} required={form.isRequired('track.lyrics')} error={all[p + 'lyrics']}
          hint={form.textFor('track.lyrics', 'hint', 'Cole a letra completa, preservando versos e refrões. Se a faixa for instrumental, deixe em branco.')}>
          <Textarea className={inputCls(!!all[p + 'lyrics'])} rows={8}
            placeholder={form.textFor('track.lyrics', 'placeholder', 'Cole aqui a letra completa da música…')}
            value={track.lyrics}
            onChange={(ev) => form.setTrack(track.id, { lyrics: ev.target.value, timedLyrics: [] })} />
        </Field> : null}

        {form.isVisible('track.audio') ? <Field label={form.textFor('track.audio', 'label', 'Áudio da faixa')} required={form.isRequired('track.audio')} error={all[p + 'audio']}
          hint={form.textFor('track.audio', 'hint', 'Master em WAV ou FLAC. Analisamos o arquivo automaticamente.')}>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-foreground/25 bg-card/50 p-4 transition-colors hover:border-accent hover:bg-accent/5">
            <input type="file" accept=".wav,.flac,audio/wav,audio/x-wav,audio/flac,audio/x-flac" className="sr-only" onChange={(ev) => onAudio(ev.target.files?.[0])} />
            {checking ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <FileAudio className="h-5 w-5 text-accent" />}
            <span className="text-sm font-semibold">{track.audioFileName ?? 'Clique para anexar o áudio'}</span>
          </label>
          {audio && form.isVisible('track.audioAnalysis') && (
            <div className={`mt-3 rounded-xl border-2 p-3 text-xs leading-relaxed ${audio.ok ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-accent/50 bg-accent/10'}`}>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className={`h-4 w-4 ${audio.ok ? 'text-emerald-600' : 'text-accent'}`} />
                {form.textFor('track.audioAnalysis', 'label', 'Análise do áudio')} — {audio.format} · {audio.duration} min{audio.sampleRate ? ` · ${audio.sampleRate} Hz · ${audio.bitDepth} bits · ${audio.channels === 2 ? 'estéreo' : `${audio.channels} canal(is)`}` : ''}
              </div>
              <p className="mt-1 text-muted-foreground">{form.textFor('track.audioAnalysis', 'hint', 'Confira abaixo a compatibilidade do master com os padrões técnicos configurados.')}</p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {audio.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {audio.standards.map((standard) => <div key={standard.label} className="rounded-lg bg-card/70 px-2.5 py-2">
                  <p className="font-bold">{standard.status === 'ok' ? '✓' : standard.status === 'warning' ? '◐' : '×'} {standard.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{standard.detail}</p>
                </div>)}
              </div>
            </div>
          )}
        </Field> : null}

        {form.isVisible('track.lyrics') && form.isVisible('track.lyricsSync') ? <LyricsSyncEditor
          audioFile={form.audioFiles[track.id]}
          lyrics={track.lyrics}
          lines={track.timedLyrics}
          title={track.title}
          artist={track.mainArtists}
          workspaceSlug={workspaceSlug}
          heading={form.textFor('track.lyricsSync', 'label', 'Sincronização da letra')}
          description={form.textFor('track.lyricsSync', 'hint', 'Ao gerar, o áudio e a letra serão processados pela IA do Google apenas para sugerir os tempos. Revise antes de exportar; o texto da letra não é alterado.')}
          generateLabel={form.textFor('track.lyricsSync', 'placeholder', 'Gerar timestamps com IA')}
          onChange={(timedLyrics) => form.setTrack(track.id, { timedLyrics })}
        /> : null}
      </div>
    </div>
  )
}

export function Faixas({ form, showErrors, workspaceSlug }: { form: F; showErrors: boolean; workspaceSlug: string }) {
  const all = showErrors ? form.errorsFor('faixas') : {}
  const isSingle = form.data.releaseType === 'single'
  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title={form.textFor('intro.faixas', 'label', 'Faixas e créditos')}
        description={form.textFor('intro.faixas', 'hint', 'Cadastre cada música com seus créditos. Capriche aqui: é desses dados que saem o ISRC, os créditos nas plataformas e a distribuição.')}
      />
      {form.isVisible('focusTrack') && all.focusTrack && (
        <p className="mb-4 rounded-xl border-2 border-accent/50 bg-accent/10 p-3 text-xs font-semibold text-accent">
          {all.focusTrack}
        </p>
      )}
      {all.trackCount && <p className="mb-4 rounded-xl border-2 border-accent/50 bg-accent/10 p-3 text-xs font-semibold text-accent">{all.trackCount}</p>}
      <div className="space-y-6">
        {form.data.tracks.map((_, i) => (
          <TrackCard key={form.data.tracks[i].id} form={form} index={i} showErrors={showErrors} workspaceSlug={workspaceSlug} />
        ))}
      </div>
      {!isSingle ? <Button type="button" variant="outline"
        className="mt-6 w-full rounded-2xl border-2 border-dashed border-foreground/30 bg-transparent h-14 font-bold hover:border-accent hover:bg-accent/5"
        onClick={form.addTrack}>
        <Plus className="mr-1 h-5 w-5" /> Adicionar outra faixa
      </Button> : null}
      {form.isVisible('focusTrack') ? <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Music2 className="h-3.5 w-3.5" /> {isSingle ? 'Em um single, a faixa única é automaticamente definida como faixa foco.' : form.textFor('focusTrack', 'hint', 'Marque com ⭐ a faixa foco — ela guia o plano de divulgação.')}
      </p> : null}
    </div>
  )
}
