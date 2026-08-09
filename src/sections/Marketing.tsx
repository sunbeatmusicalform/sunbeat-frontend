import type { ReactNode } from 'react'
import { BarChart3, CalendarDays, Megaphone, WalletCards } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Field, StepHeader, inputCls } from './ui'
import { type useIntakeForm } from '@/hooks/useIntakeForm'
import { GOAL_OPTIONS, type DateFlexibility, type PromotionCommitment } from '@/types/intake'

type F = ReturnType<typeof useIntakeForm>

function MarketingBlock({ title, description, icon, children }: { title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border-2 border-foreground/12 bg-card/35 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#329fd7]/12 text-[#237eae]">{icon}</span>
        <div>
          <h3 className="font-display text-lg font-black">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

const DATE_OPTIONS: { value: DateFlexibility; label: string; description: string }[] = [
  { value: 'fixed', label: 'Data fixa', description: 'Não há margem para alteração.' },
  { value: 'some', label: 'Alguma flexibilidade', description: 'Podemos avaliar pequenos ajustes.' },
  { value: 'open', label: 'Data aberta', description: 'Pode ser definida com o planejamento.' },
]

export function Marketing({ form, showErrors }: { form: F; showErrors: boolean }) {
  const e = showErrors ? form.errorsFor('marketing') : {}
  const d = form.data
  const focusTrack = d.tracks.find((track) => track.isFocus)

  function toggleGoal(goal: string) {
    form.setData('goals', d.goals.includes(goal) ? d.goals.filter((item) => item !== goal) : [...d.goals, goal])
  }

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title={form.textFor('intro.marketing', 'label', 'Plano de divulgação')}
        description={form.textFor('intro.marketing', 'hint', 'Contexto estratégico, condições da campanha e pessoas que podem ampliar o lançamento.')}
      />
      <div className="space-y-5">
        <MarketingBlock
          title="Contexto e objetivos"
          description="O histórico e a intenção do projeto ajudam a equipe a definir os melhores argumentos e prioridades."
          icon={<BarChart3 className="h-4.5 w-4.5" />}
        >
          {form.isVisible('marketingNumbers') ? <Field label={form.textFor('marketingNumbers', 'label', 'Números e resultados relevantes')} required={form.isRequired('marketingNumbers')} error={e.marketingNumbers}
            hint={form.textFor('marketingNumbers', 'hint', 'Marcos que fortaleçam a narrativa: shows, streams, audiência, hits, colaborações ou imprensa.')}>
            <Textarea className={inputCls(!!e.marketingNumbers)} rows={3}
              placeholder={form.textFor('marketingNumbers', 'placeholder', 'Ex.: turnê com 12 datas; 500 mil streams; composição no Top 200; abertura para…')}
              value={d.marketingNumbers} onChange={(event) => form.setData('marketingNumbers', event.target.value)} />
          </Field> : null}

          {form.isVisible('focusDescription') ? <Field label={form.textFor('focusDescription', 'label', 'Foco do artista e do lançamento')} required={form.isRequired('focusDescription')} error={e.focusDescription}
            hint={form.textFor('focusDescription', 'hint', 'Em uma frase: o que este projeto precisa conquistar agora?')}>
            <Textarea className={inputCls(!!e.focusDescription)} rows={3}
              placeholder={form.textFor('focusDescription', 'placeholder', 'Ex.: ampliar ouvintes mensais e posicionar a faixa foco em playlists de MPB.')}
              value={d.focusDescription} onChange={(event) => form.setData('focusDescription', event.target.value)} />
          </Field> : null}

          {form.isVisible('goals') ? <Field label={form.textFor('goals', 'label', 'Objetivos do lançamento')} required={form.isRequired('goals')} error={e.goals} hint={form.textFor('goals', 'hint', 'Escolha todos que fizerem sentido.')}>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((goal) => (
                <Label key={goal} htmlFor={`goal-${goal}`}
                  className={`flex min-h-16 cursor-pointer items-center gap-2.5 rounded-2xl border-2 p-3 text-sm font-semibold transition-all ${d.goals.includes(goal) ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-card/60 hover:border-foreground/30'}`}>
                  <Checkbox id={`goal-${goal}`} checked={d.goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} />
                  {goal}
                </Label>
              ))}
            </div>
          </Field> : null}
        </MarketingBlock>

        <MarketingBlock
          title="Condições do plano"
          description="Verba, faixa foco e flexibilidade de calendário mudam diretamente o desenho da campanha."
          icon={<WalletCards className="h-4.5 w-4.5" />}
        >
          {form.isVisible('focusTrack') ? <div className="rounded-2xl border border-foreground/10 bg-background/55 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Faixa foco selecionada</p>
            <p className="mt-1 text-sm font-bold">{focusTrack?.title || 'Definida na etapa Faixas'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Este valor é vinculado automaticamente, sem pedir a mesma informação duas vezes.</p>
          </div> : null}

          {form.isVisible('hasMarketingBudget') ? <Field label={form.textFor('hasMarketingBudget', 'label', 'Há verba para promoção?')} required={form.isRequired('hasMarketingBudget')} error={e.hasMarketingBudget} hint={form.textFor('hasMarketingBudget', 'hint', 'Considere mídia, creators, imprensa, conteúdo e impulsionamento.')}>
            <RadioGroup className="flex flex-wrap gap-3"
              value={d.hasMarketingBudget === null ? '' : d.hasMarketingBudget ? 'yes' : 'no'}
              onValueChange={(value) => form.setData('hasMarketingBudget', value === 'yes')}>
              {[['yes', 'Sim'], ['no', 'Não']].map(([value, label]) => (
                <Label key={value} htmlFor={`budget-${value}`}
                  className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.hasMarketingBudget === (value === 'yes') && d.hasMarketingBudget !== null ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-card/60 hover:border-foreground/30'}`}>
                  <RadioGroupItem value={value} id={`budget-${value}`} className="sr-only" />{label}
                </Label>
              ))}
            </RadioGroup>
          </Field> : null}

          {form.isVisible('marketingBudget') && d.hasMarketingBudget ? (
            <Field label={form.textFor('marketingBudget', 'label', 'Valor ou faixa de investimento')} required={form.isRequired('marketingBudget')} error={e.marketingBudget} hint={form.textFor('marketingBudget', 'hint', 'Pode ser aproximado; se ainda estiver em definição, informe uma faixa.')}>
              <Input className={inputCls(!!e.marketingBudget)} placeholder={form.textFor('marketingBudget', 'placeholder', 'Ex.: R$ 5.000 a R$ 8.000')}
                value={d.marketingBudget} onChange={(event) => form.setData('marketingBudget', event.target.value)} />
            </Field>
          ) : null}

          {form.isVisible('dateFlexibility') ? <Field label={form.textFor('dateFlexibility', 'label', 'Flexibilidade da data de lançamento')} required={form.isRequired('dateFlexibility')} error={e.dateFlexibility} hint={form.textFor('dateFlexibility', 'hint', 'Ajuda a conciliar distribuição, campanha, imprensa e calendário.')}>
            <RadioGroup className="grid gap-2 sm:grid-cols-3" value={d.dateFlexibility}
              onValueChange={(value) => form.setData('dateFlexibility', value as DateFlexibility)}>
              {DATE_OPTIONS.map((option) => (
                <Label key={option.value} htmlFor={`date-flex-${option.value}`}
                  className={`cursor-pointer rounded-2xl border-2 p-3 transition-all ${d.dateFlexibility === option.value ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-card/60 hover:border-foreground/30'}`}>
                  <RadioGroupItem value={option.value} id={`date-flex-${option.value}`} className="sr-only" />
                  <span className="flex items-center gap-1.5 text-sm font-bold"><CalendarDays className="h-3.5 w-3.5" />{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{option.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </Field> : null}
        </MarketingBlock>

        <MarketingBlock
          title="Participações e alcance"
          description="Quem pode entrar na narrativa e ajudar a divulgação a ganhar tração."
          icon={<Megaphone className="h-4.5 w-4.5" />}
        >
          {form.isVisible('hasSpecialGuests') ? <Field label={form.textFor('hasSpecialGuests', 'label', 'O lançamento tem participações especiais?')} required={form.isRequired('hasSpecialGuests')} error={e.hasSpecialGuests}
            hint={form.textFor('hasSpecialGuests', 'hint', 'Outros artistas com papel de destaque no projeto ou na divulgação.')}>
            <RadioGroup className="flex flex-wrap gap-3"
              value={d.hasSpecialGuests === null ? '' : d.hasSpecialGuests ? 'yes' : 'no'}
              onValueChange={(value) => form.setData('hasSpecialGuests', value === 'yes')}>
              {[['yes', 'Sim'], ['no', 'Não']].map(([value, label]) => (
                <Label key={value} htmlFor={`guests-${value}`}
                  className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.hasSpecialGuests === (value === 'yes') && d.hasSpecialGuests !== null ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-card/60 hover:border-foreground/30'}`}>
                  <RadioGroupItem value={value} id={`guests-${value}`} className="sr-only" />{label}
                </Label>
              ))}
            </RadioGroup>
          </Field> : null}

          {d.hasSpecialGuests ? (
            <>
              {form.isVisible('guestsBio') ? <Field label={form.textFor('guestsBio', 'label', 'Mini bio das participações')} required={form.isRequired('guestsBio')} error={e.guestsBio}
                hint={form.textFor('guestsBio', 'hint', '2 a 3 linhas sobre cada participante para o release e o pitch.')}>
                <Textarea className={inputCls(!!e.guestsBio)} rows={4}
                  placeholder={form.textFor('guestsBio', 'placeholder', '')}
                  value={d.guestsBio} onChange={(event) => form.setData('guestsBio', event.target.value)} />
              </Field> : null}
              {form.isVisible('guestsPromote') ? <Field label={form.textFor('guestsPromote', 'label', 'As participações vão divulgar junto?')} required={form.isRequired('guestsPromote')} error={e.guestsPromote} hint={form.textFor('guestsPromote', 'hint', 'Se sim, podemos preparar peças e orientações específicas.')}>
                <RadioGroup className="flex flex-wrap gap-3" value={d.guestsPromote}
                  onValueChange={(value) => form.setData('guestsPromote', value as PromotionCommitment)}>
                  {[['yes', 'Sim'], ['no', 'Não'], ['maybe', 'A confirmar']].map(([value, label]) => (
                    <Label key={value} htmlFor={`promo-${value}`}
                      className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.guestsPromote === value ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-card/60 hover:border-foreground/30'}`}>
                      <RadioGroupItem value={value} id={`promo-${value}`} className="sr-only" />{label}
                    </Label>
                  ))}
                </RadioGroup>
              </Field> : null}
              {form.isVisible('promoParticipants') ? <Field label={form.textFor('promoParticipants', 'label', 'Participantes na promoção')} required={form.isRequired('promoParticipants')} error={e.promoParticipants} hint={form.textFor('promoParticipants', 'hint', 'Quem entra na divulgação e em quais canais.')}>
                <Input className={inputCls(!!e.promoParticipants)} placeholder={form.textFor('promoParticipants', 'placeholder', 'Ex.: Zé Raminho — Instagram e imprensa')}
                  value={d.promoParticipants} onChange={(event) => form.setData('promoParticipants', event.target.value)} />
              </Field> : null}
            </>
          ) : null}

          {form.isVisible('influencers') ? <Field label={form.textFor('influencers', 'label', 'Influenciadores, marcas e parceiros')} required={form.isRequired('influencers')} error={e.influencers}
            hint={form.textFor('influencers', 'hint', 'Parcerias confirmadas ou em negociação que podem amplificar o lançamento.')}>
            <Textarea className={inputCls(!!e.influencers)} rows={3} placeholder={form.textFor('influencers', 'placeholder', 'Ex.: @canaldemusica, marca Y — em conversa')}
              value={d.influencers} onChange={(event) => form.setData('influencers', event.target.value)} />
          </Field> : null}
        </MarketingBlock>
      </div>
    </div>
  )
}
