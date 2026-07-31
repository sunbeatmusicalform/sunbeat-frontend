import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Field, StepHeader, inputCls } from './ui'
import { fieldErrors, type useIntakeForm } from '@/hooks/useIntakeForm'
import { GOAL_OPTIONS } from '@/types/intake'

type F = ReturnType<typeof useIntakeForm>

export function Marketing({ form, showErrors }: { form: F; showErrors: boolean }) {
  const e = showErrors ? fieldErrors('marketing', form.data) : {}
  const d = form.data

  function toggleGoal(g: string) {
    form.setData('goals', d.goals.includes(g) ? d.goals.filter((x) => x !== g) : [...d.goals, g])
  }

  return (
    <div className="mx-auto max-w-xl">
      <StepHeader
        title="Plano de divulgação"
        description="Essas respostas viram o briefing de marketing do lançamento — quanto mais contexto, melhor o plano."
      />
      <div className="space-y-6">
        <Field label="Foco do lançamento" required error={e.focusDescription}
          hint="Em uma frase: o que essa faixa/projeto precisa conquistar?">
          <Textarea className={inputCls(!!e.focusDescription)} rows={2}
            placeholder="Ex.: Levar a faixa foco às playlists editoriais de MPB e abrir temporada de shows."
            value={d.focusDescription} onChange={(ev) => form.setData('focusDescription', ev.target.value)} />
        </Field>

        <Field label="Metas do lançamento" required error={e.goals} hint="Escolha todas que fizerem sentido.">
          <div className="grid gap-2 sm:grid-cols-2">
            {GOAL_OPTIONS.map((g) => (
              <Label key={g} htmlFor={`goal-${g}`}
                className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 p-3 text-sm font-semibold transition-all ${d.goals.includes(g) ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                <Checkbox id={`goal-${g}`} checked={d.goals.includes(g)} onCheckedChange={() => toggleGoal(g)} />
                {g}
              </Label>
            ))}
          </div>
        </Field>

        <Field label="Participações especiais?" required error={e.hasSpecialGuests}
          hint="Outros artistas com papel de destaque na divulgação (não só feats).">
          <RadioGroup className="flex gap-3"
            value={d.hasSpecialGuests === null ? '' : d.hasSpecialGuests ? 'yes' : 'no'}
            onValueChange={(v) => form.setData('hasSpecialGuests', v === 'yes')}>
            {[['yes', 'Sim'], ['no', 'Não']].map(([v, t]) => (
              <Label key={v} htmlFor={`guests-${v}`}
                className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${(d.hasSpecialGuests === (v === 'yes')) && d.hasSpecialGuests !== null ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                <RadioGroupItem value={v} id={`guests-${v}`} className="sr-only" />{t}
              </Label>
            ))}
          </RadioGroup>
        </Field>

        {d.hasSpecialGuests && (
          <>
            <Field label="Mini bio das participações" required error={e.guestsBio}
              hint="2 a 3 linhas sobre cada participante — usamos no release e pitch para playlists.">
              <Textarea className={inputCls(!!e.guestsBio)} rows={3}
                value={d.guestsBio} onChange={(ev) => form.setData('guestsBio', ev.target.value)} />
            </Field>
            <Field label="As participações vão divulgar junto?"
              hint="Se sim, preparamos kit de divulgação para elas.">
              <RadioGroup className="flex gap-3"
                value={d.guestsPromote === null ? '' : d.guestsPromote ? 'yes' : 'no'}
                onValueChange={(v) => form.setData('guestsPromote', v === 'yes')}>
                {[['yes', 'Sim'], ['no', 'Não'], ['maybe', 'A confirmar']].map(([v, t]) => (
                  <Label key={v} htmlFor={`promo-${v}`}
                    className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.guestsPromote !== null && (d.guestsPromote === (v === 'yes')) && v !== 'maybe' ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                    <RadioGroupItem value={v} id={`promo-${v}`} className="sr-only" />{t}
                  </Label>
                ))}
              </RadioGroup>
            </Field>
            <Field label="Participantes na promoção" hint="Quem entra na divulgação e em quais canais.">
              <Input className={inputCls()} placeholder="Ex.: Zé Raminho (Instagram e imprensa)"
                value={d.promoParticipants} onChange={(ev) => form.setData('promoParticipants', ev.target.value)} />
            </Field>
          </>
        )}

        <Field label="Influenciadores, marcas e parceiros (opcional)"
          hint="Parcerias confirmadas ou em negociação que podem amplificar o lançamento.">
          <Textarea className={inputCls()} rows={2} placeholder="Ex.: @canal de música X, marca Y (em conversa)"
            value={d.influencers} onChange={(ev) => form.setData('influencers', ev.target.value)} />
        </Field>
      </div>
    </div>
  )
}
