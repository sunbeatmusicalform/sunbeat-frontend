import type { ReactNode } from 'react'
import { BarChart3, CalendarDays, Megaphone, WalletCards } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Field, StepHeader, inputCls } from './ui'
import { fieldErrors, type useIntakeForm } from '@/hooks/useIntakeForm'
import { GOAL_OPTIONS, type DateFlexibility, type PromotionCommitment } from '@/types/intake'

type F = ReturnType<typeof useIntakeForm>

function MarketingBlock({ title, description, icon, children }: { title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border-2 border-foreground/12 bg-white/35 p-5 sm:p-6">
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
  const e = showErrors ? fieldErrors('marketing', form.data) : {}
  const d = form.data
  const focusTrack = d.tracks.find((track) => track.isFocus)

  function toggleGoal(goal: string) {
    form.setData('goals', d.goals.includes(goal) ? d.goals.filter((item) => item !== goal) : [...d.goals, goal])
  }

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title="Plano de divulgação"
        description="Contexto estratégico, condições da campanha e pessoas que podem ampliar o lançamento."
      />
      <div className="space-y-5">
        <MarketingBlock
          title="Contexto e objetivos"
          description="O histórico e a intenção do projeto ajudam a Atabaque a definir os melhores argumentos e prioridades."
          icon={<BarChart3 className="h-4.5 w-4.5" />}
        >
          <Field label="Números e resultados relevantes (opcional)"
            hint="Marcos que fortaleçam a narrativa: shows, streams, audiência, hits, colaborações ou imprensa.">
            <Textarea className={inputCls()} rows={3}
              placeholder="Ex.: turnê com 12 datas; 500 mil streams; composição no Top 200; abertura para…"
              value={d.marketingNumbers} onChange={(event) => form.setData('marketingNumbers', event.target.value)} />
          </Field>

          <Field label="Foco do artista e do lançamento" required error={e.focusDescription}
            hint="Em uma frase: o que este projeto precisa conquistar agora?">
            <Textarea className={inputCls(!!e.focusDescription)} rows={3}
              placeholder="Ex.: ampliar ouvintes mensais e posicionar a faixa foco em playlists de MPB."
              value={d.focusDescription} onChange={(event) => form.setData('focusDescription', event.target.value)} />
          </Field>

          <Field label="Objetivos do lançamento" required error={e.goals} hint="Escolha todos que fizerem sentido.">
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((goal) => (
                <Label key={goal} htmlFor={`goal-${goal}`}
                  className={`flex min-h-16 cursor-pointer items-center gap-2.5 rounded-2xl border-2 p-3 text-sm font-semibold transition-all ${d.goals.includes(goal) ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                  <Checkbox id={`goal-${goal}`} checked={d.goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} />
                  {goal}
                </Label>
              ))}
            </div>
          </Field>
        </MarketingBlock>

        <MarketingBlock
          title="Condições do plano"
          description="Verba, faixa foco e flexibilidade de calendário mudam diretamente o desenho da campanha."
          icon={<WalletCards className="h-4.5 w-4.5" />}
        >
          <div className="rounded-2xl border border-foreground/10 bg-background/55 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Faixa foco selecionada</p>
            <p className="mt-1 text-sm font-bold">{focusTrack?.title || 'Definida na etapa Faixas'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Este valor é vinculado automaticamente, sem pedir a mesma informação duas vezes.</p>
          </div>

          <Field label="Há verba para promoção?" hint="Considere mídia, creators, imprensa, conteúdo e impulsionamento.">
            <RadioGroup className="flex flex-wrap gap-3"
              value={d.hasMarketingBudget === null ? '' : d.hasMarketingBudget ? 'yes' : 'no'}
              onValueChange={(value) => form.setData('hasMarketingBudget', value === 'yes')}>
              {[['yes', 'Sim'], ['no', 'Não']].map(([value, label]) => (
                <Label key={value} htmlFor={`budget-${value}`}
                  className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.hasMarketingBudget === (value === 'yes') && d.hasMarketingBudget !== null ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                  <RadioGroupItem value={value} id={`budget-${value}`} className="sr-only" />{label}
                </Label>
              ))}
            </RadioGroup>
          </Field>

          {d.hasMarketingBudget ? (
            <Field label="Valor ou faixa de investimento" hint="Pode ser aproximado; se ainda estiver em definição, informe uma faixa.">
              <Input className={inputCls()} placeholder="Ex.: R$ 5.000 a R$ 8.000"
                value={d.marketingBudget} onChange={(event) => form.setData('marketingBudget', event.target.value)} />
            </Field>
          ) : null}

          <Field label="Flexibilidade da data de lançamento" hint="Ajuda a conciliar distribuição, campanha, imprensa e calendário.">
            <RadioGroup className="grid gap-2 sm:grid-cols-3" value={d.dateFlexibility}
              onValueChange={(value) => form.setData('dateFlexibility', value as DateFlexibility)}>
              {DATE_OPTIONS.map((option) => (
                <Label key={option.value} htmlFor={`date-flex-${option.value}`}
                  className={`cursor-pointer rounded-2xl border-2 p-3 transition-all ${d.dateFlexibility === option.value ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                  <RadioGroupItem value={option.value} id={`date-flex-${option.value}`} className="sr-only" />
                  <span className="flex items-center gap-1.5 text-sm font-bold"><CalendarDays className="h-3.5 w-3.5" />{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{option.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </Field>
        </MarketingBlock>

        <MarketingBlock
          title="Participações e alcance"
          description="Quem pode entrar na narrativa e ajudar a divulgação a ganhar tração."
          icon={<Megaphone className="h-4.5 w-4.5" />}
        >
          <Field label="O lançamento tem participações especiais?" required error={e.hasSpecialGuests}
            hint="Outros artistas com papel de destaque no projeto ou na divulgação.">
            <RadioGroup className="flex flex-wrap gap-3"
              value={d.hasSpecialGuests === null ? '' : d.hasSpecialGuests ? 'yes' : 'no'}
              onValueChange={(value) => form.setData('hasSpecialGuests', value === 'yes')}>
              {[['yes', 'Sim'], ['no', 'Não']].map(([value, label]) => (
                <Label key={value} htmlFor={`guests-${value}`}
                  className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.hasSpecialGuests === (value === 'yes') && d.hasSpecialGuests !== null ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                  <RadioGroupItem value={value} id={`guests-${value}`} className="sr-only" />{label}
                </Label>
              ))}
            </RadioGroup>
          </Field>

          {d.hasSpecialGuests ? (
            <>
              <Field label="Mini bio das participações" required error={e.guestsBio}
                hint="2 a 3 linhas sobre cada participante para o release e o pitch.">
                <Textarea className={inputCls(!!e.guestsBio)} rows={4}
                  value={d.guestsBio} onChange={(event) => form.setData('guestsBio', event.target.value)} />
              </Field>
              <Field label="As participações vão divulgar junto?" hint="Se sim, podemos preparar peças e orientações específicas.">
                <RadioGroup className="flex flex-wrap gap-3" value={d.guestsPromote}
                  onValueChange={(value) => form.setData('guestsPromote', value as PromotionCommitment)}>
                  {[['yes', 'Sim'], ['no', 'Não'], ['maybe', 'A confirmar']].map(([value, label]) => (
                    <Label key={value} htmlFor={`promo-${value}`}
                      className={`cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all ${d.guestsPromote === value ? 'border-accent bg-accent/10' : 'border-foreground/15 bg-white/60 hover:border-foreground/30'}`}>
                      <RadioGroupItem value={value} id={`promo-${value}`} className="sr-only" />{label}
                    </Label>
                  ))}
                </RadioGroup>
              </Field>
              <Field label="Participantes na promoção" hint="Quem entra na divulgação e em quais canais.">
                <Input className={inputCls()} placeholder="Ex.: Zé Raminho — Instagram e imprensa"
                  value={d.promoParticipants} onChange={(event) => form.setData('promoParticipants', event.target.value)} />
              </Field>
            </>
          ) : null}

          <Field label="Influenciadores, marcas e parceiros (opcional)"
            hint="Parcerias confirmadas ou em negociação que podem amplificar o lançamento.">
            <Textarea className={inputCls()} rows={3} placeholder="Ex.: @canaldemusica, marca Y — em conversa"
              value={d.influencers} onChange={(event) => form.setData('influencers', event.target.value)} />
          </Field>
        </MarketingBlock>
      </div>
    </div>
  )
}
