import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CheckCircle2, CircleAlert, Star } from 'lucide-react'
import { StepHeader } from './ui'
import { STEPS, type StepId, type useIntakeForm } from '@/hooks/useIntakeForm'

type F = ReturnType<typeof useIntakeForm>

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-4">
      <span className="w-40 shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium whitespace-pre-line">{value}</span>
    </div>
  )
}

export function Revisao({ form, goTo, showErrors }: { form: F; goTo: (s: StepId) => void; showErrors: boolean }) {
  const d = form.data
  const sectionStatus = STEPS.filter((s) => s.id !== 'revisao').map((s) => ({
    ...s,
    errors: form.errorsFor(s.id, 'submit'),
  }))
  const reviewErrors = showErrors ? form.errorsFor('revisao', 'submit') : {}
  const label = (key: string, fallback: string) => form.textFor(key, 'label', fallback)

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title={form.textFor('intro.revisao', 'label', 'Revisão final')}
        description={form.textFor('intro.revisao', 'hint', 'Confira o resumo abaixo. Se algo estiver faltando, avisamos aqui — nada de erro genérico só no fim.')}
      />

      <div className="mb-8 grid gap-2 sm:grid-cols-4">
        {sectionStatus.map((s) => {
          const ok = Object.keys(s.errors).length === 0
          return (
            <button key={s.id} onClick={() => goTo(s.id)}
              className={`rounded-2xl border-2 p-3 text-left transition-all hover:scale-[1.02] ${ok ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-accent/60 bg-accent/10'}`}>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleAlert className="h-4 w-4 text-accent" />}
                {s.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {ok ? 'Completo' : `${Object.keys(s.errors).length} pendência(s) — toque para revisar`}
              </div>
            </button>
          )
        })}
      </div>

      <div className="sun-card rounded-3xl p-6">
        <h3 className="font-display text-xl font-black">{form.isVisible('projectName') ? d.projectName || 'Projeto sem nome' : 'Resumo do lançamento'}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {form.isVisible('releaseType') ? d.releaseType === 'single' ? 'Single' : d.releaseType === 'ep' ? 'EP' : d.releaseType === 'album' ? 'Álbum' : '—' : ''}
          {form.isVisible('genre') && d.genre ? ` · ${d.genre}` : ''} {form.isVisible('releaseDate') && d.releaseDate ? ` · Lançamento em ${new Date(d.releaseDate + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
        </p>
        <Separator className="my-4 bg-foreground/10" />
        {form.isVisible('responsibleName') && <Row label={label('responsibleName', 'Responsável')} value={d.responsibleName && `${d.responsibleName}${form.isVisible('responsibleEmail') && d.responsibleEmail ? ` · ${d.responsibleEmail}` : ''}`} />}
        {form.isVisible('coverFileName') && <Row label={label('coverFileName', 'Capa')} value={d.coverFileName} />}
        {form.isVisible('videoLink') && <Row label={label('videoLink', 'Vídeo')} value={d.videoLink && `${d.videoLink}${form.isVisible('videoDate') && d.videoDate ? ` · ${new Date(d.videoDate + 'T12:00').toLocaleDateString('pt-BR')}` : ''}`} />}
        {form.isVisible('additionalFiles') && <Row label={label('additionalFiles', 'Kit visual')} value={d.additionalFiles} />}
        <Separator className="my-4 bg-foreground/10" />
        <div className="space-y-3">
          {d.tracks.map((t, i) => (
            <div key={t.id} className="rounded-2xl bg-card/50 p-4">
              <div className="flex items-center gap-2 font-bold text-sm">
                {i + 1}. {t.title || 'Sem título'}
                {form.isVisible('focusTrack') && t.isFocus && <Star className="h-4 w-4 fill-secondary text-secondary" />}
                {form.isVisible('track.hasISRC') && (t.hasISRC === 'yes'
                  ? <Badge variant="outline" className="border-foreground/30 text-xs">ISRC {t.isrc}</Badge>
                  : <Badge className="bg-[#329fd7]/20 text-[#1c6e99] text-xs">ISRC a gerar</Badge>)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {form.isVisible('track.mainArtists') ? t.mainArtists : ''}
                {form.isVisible('track.featArtists') && t.featArtists ? ` feat. ${t.featArtists}` : ''}
                {form.isVisible('track.composers') ? ` · comp. ${t.composers || '—'}` : ''}
                {form.isVisible('track.audio') ? ` · ${t.audioFileName ?? 'sem áudio'}` : ''}
              </div>
              {form.isVisible('track.lyrics') && t.lyrics && (
                <details className="mt-3 rounded-xl border border-foreground/10 bg-card/45 px-3 py-2 text-xs">
                  <summary className="cursor-pointer font-bold">Ver letra da música</summary>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{t.lyrics}</p>
                </details>
              )}
            </div>
          ))}
        </div>
        <Separator className="my-4 bg-foreground/10" />
        {form.isVisible('marketingNumbers') && <Row label={label('marketingNumbers', 'Números e resultados')} value={d.marketingNumbers} />}
        {form.isVisible('focusDescription') && <Row label={label('focusDescription', 'Foco')} value={d.focusDescription} />}
        {form.isVisible('goals') && <Row label={label('goals', 'Metas')} value={d.goals.join(' · ')} />}
        {form.isVisible('hasMarketingBudget') && <Row label={label('hasMarketingBudget', 'Verba de promoção')} value={d.hasMarketingBudget === null ? undefined : d.hasMarketingBudget ? d.marketingBudget || 'Sim, valor a confirmar' : 'Não'} />}
        {form.isVisible('dateFlexibility') && <Row label={label('dateFlexibility', 'Flexibilidade da data')} value={d.dateFlexibility === 'fixed' ? 'Data fixa' : d.dateFlexibility === 'some' ? 'Alguma flexibilidade' : d.dateFlexibility === 'open' ? 'Data aberta para planejamento' : undefined} />}
        {form.isVisible('guestsBio') && <Row label={label('guestsBio', 'Participações')} value={d.hasSpecialGuests ? d.guestsBio : undefined} />}
        {form.isVisible('guestsPromote') && <Row label={label('guestsPromote', 'Divulgação das participações')} value={d.hasSpecialGuests ? d.guestsPromote === 'yes' ? 'Sim' : d.guestsPromote === 'no' ? 'Não' : d.guestsPromote === 'maybe' ? 'A confirmar' : undefined : undefined} />}
        {form.isVisible('influencers') && <Row label={label('influencers', 'Parceiros')} value={d.influencers} />}
        {form.isVisible('notes') && <Row label={label('notes', 'Observações')} value={d.notes} />}
      </div>

      {/* aviso de confidencialidade */}
      {form.isVisible('review.confidentiality') && <p className="mt-5 rounded-xl border-2 border-foreground/10 bg-card/40 p-3.5 text-[11px] leading-relaxed text-muted-foreground">
        🔒 {form.textFor('review.confidentiality', 'hint', 'Materiais enviados neste formulário podem conter informações confidenciais de projeto musical. Compartilhe apenas arquivos necessários ao fluxo e evite encaminhar links de rascunho, edição ou download para pessoas não envolvidas.')}
      </p>}

      {/* consentimento LGPD */}
      {form.isVisible('consentTruth') && <div className={`mt-4 rounded-2xl border-2 p-4 ${reviewErrors.consentTruth ? 'border-accent bg-accent/5' : 'border-foreground/15 bg-card/50'}`}>
        <Label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
          <Checkbox id="consent" className="mt-0.5" checked={d.consentTruth}
            onCheckedChange={(v) => form.setData('consentTruth', v === true)} />
          <span className="text-xs leading-relaxed text-foreground/85">
            {form.textFor('consentTruth', 'hint', 'Ao enviar este formulário, confirmo que as informações fornecidas são verdadeiras e autorizo seu uso pela equipe responsável e pela Sunbeat para fins de análise, cadastro, operação, comunicação e organização dos materiais relacionados ao projeto. Os dados serão tratados conforme a política de privacidade aplicável e compartilhados apenas com pessoas e sistemas necessários para a execução do fluxo.')}
          </span>
        </Label>
        {reviewErrors.consentTruth && (
          <p className="mt-2 text-xs font-semibold text-accent">{reviewErrors.consentTruth}</p>
        )}
      </div>}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Ao enviar, você recebe um e-mail de confirmação com o resumo e o acompanhamento das etapas.
      </p>
    </div>
  )
}
