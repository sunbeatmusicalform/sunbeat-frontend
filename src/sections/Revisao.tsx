import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CheckCircle2, CircleAlert, Star } from 'lucide-react'
import { StepHeader } from './ui'
import { fieldErrors, STEPS, type StepId, type useIntakeForm } from '@/hooks/useIntakeForm'

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
    errors: fieldErrors(s.id, d),
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title="Revisão final"
        description="Confira o resumo abaixo. Se algo estiver faltando, avisamos aqui — nada de erro genérico só no fim."
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
        <h3 className="font-display text-xl font-black">{d.projectName || 'Projeto sem nome'}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {d.releaseType === 'single' ? 'Single' : d.releaseType === 'ep' ? 'EP' : d.releaseType === 'album' ? 'Álbum' : '—'}
          {d.genre ? ` · ${d.genre}` : ''} {d.releaseDate ? ` · Lançamento em ${new Date(d.releaseDate + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
        </p>
        <Separator className="my-4 bg-foreground/10" />
        <Row label="Responsável" value={d.responsibleName && `${d.responsibleName} · ${d.responsibleEmail}`} />
        <Row label="Capa" value={d.coverFileName} />
        <Row label="Vídeo" value={d.videoLink && `${d.videoLink}${d.videoDate ? ` · ${new Date(d.videoDate + 'T12:00').toLocaleDateString('pt-BR')}` : ''}`} />
        <Separator className="my-4 bg-foreground/10" />
        <div className="space-y-3">
          {d.tracks.map((t, i) => (
            <div key={t.id} className="rounded-2xl bg-white/50 p-4">
              <div className="flex items-center gap-2 font-bold text-sm">
                {i + 1}. {t.title || 'Sem título'}
                {t.isFocus && <Star className="h-4 w-4 fill-secondary text-secondary" />}
                {t.hasISRC === 'yes'
                  ? <Badge variant="outline" className="border-foreground/30 text-xs">ISRC {t.isrc}</Badge>
                  : <Badge className="bg-[#329fd7]/20 text-[#1c6e99] text-xs">ISRC a gerar</Badge>}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.mainArtists}{t.featArtists ? ` feat. ${t.featArtists}` : ''} · comp. {t.composers || '—'} · {t.audioFileName ?? 'sem áudio'}
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4 bg-foreground/10" />
        <Row label="Foco" value={d.focusDescription} />
        <Row label="Metas" value={d.goals.join(' · ')} />
        <Row label="Participações" value={d.hasSpecialGuests ? d.guestsBio : undefined} />
        <Row label="Parceiros" value={d.influencers} />
        <Row label="Observações" value={d.notes} />
      </div>

      {/* aviso de confidencialidade */}
      <p className="mt-5 rounded-xl border-2 border-foreground/10 bg-white/40 p-3.5 text-[11px] leading-relaxed text-muted-foreground">
        🔒 Materiais enviados neste formulário podem conter informações confidenciais de projeto musical.
        Compartilhe apenas arquivos necessários ao fluxo e evite encaminhar links de rascunho, edição ou
        download para pessoas não envolvidas.
      </p>

      {/* consentimento LGPD */}
      <div className={`mt-4 rounded-2xl border-2 p-4 ${showErrors && !d.consentTruth ? 'border-accent bg-accent/5' : 'border-foreground/15 bg-white/50'}`}>
        <Label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
          <Checkbox id="consent" className="mt-0.5" checked={d.consentTruth}
            onCheckedChange={(v) => form.setData('consentTruth', v === true)} />
          <span className="text-xs leading-relaxed text-foreground/85">
            Ao enviar este formulário, confirmo que as informações fornecidas são verdadeiras e autorizo
            seu uso pela <strong>Atabaque</strong> e pela <strong>Sunbeat</strong> para fins de análise, cadastro,
            operação de lançamento, clearance, contratos, comunicação e organização dos materiais relacionados
            ao projeto. Os dados serão tratados conforme a política de privacidade aplicável e compartilhados
            apenas com pessoas e sistemas necessários para a execução do fluxo.
          </span>
        </Label>
        {showErrors && !d.consentTruth && (
          <p className="mt-2 text-xs font-semibold text-accent">É preciso confirmar a declaração antes de enviar.</p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Ao enviar, você recebe um e-mail de confirmação com o resumo e o acompanhamento das etapas.
      </p>
    </div>
  )
}
