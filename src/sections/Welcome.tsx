import { Button } from '@/components/ui/button'
import { ArrowRight, FileAudio, Image as ImageIcon, Mail, Clock3 } from 'lucide-react'
import type { StepId } from '@/hooks/useIntakeForm'
import { type useIntakeForm } from '@/hooks/useIntakeForm'

type F = ReturnType<typeof useIntakeForm>

export function Welcome({
  form, onStart, onResume, onEdit, hasDraft,
}: {
  form: F
  onStart: () => void
  onResume: () => void
  onEdit: () => void
  hasDraft: boolean
}) {
  const resume = hasDraft && onResume
  const title = form.textFor('welcome.title', 'label', 'Formulário de lançamento')
  const accentWord = form.textFor('welcome.title', 'placeholder', 'lançamento')
  const titleParts = accentWord && title.includes(accentWord) ? title.split(accentWord) : null
  const cards = [
    { key: 'welcome.estimateCard', icon: Clock3, title: '10–15 minutos', desc: 'O rascunho é salvo automaticamente para você voltar quando quiser.' },
    { key: 'welcome.haveReadyCard', icon: FileAudio, title: 'Tenha em mãos', desc: 'Áudios em WAV ou FLAC, capa quadrada (ideal 3000×3000) e créditos completos.' },
    { key: 'welcome.validationCard', icon: ImageIcon, title: 'Validação automática', desc: 'Analisamos áudio e capa na hora e avisamos se algo precisa de ajuste.' },
    { key: 'welcome.trackingCard', icon: Mail, title: 'Acompanhamento', desc: 'Você recebe e-mails a cada etapa: recebido, em análise, ajustes e aprovado.' },
  ]
  return (
    <div className="mx-auto max-w-2xl text-center py-10">
      {form.isVisible('welcome.chip') && <div className="sun-chip mx-auto mb-3">{form.textFor('welcome.chip', 'label', 'Sunbeat · Operação de lançamentos')}</div>}
      {form.isVisible('welcome.restrictedNotice') && <p className="mb-6 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
        🔒 {form.textFor('welcome.restrictedNotice', 'label', 'Formulário restrito a parceiros')} · {form.textFor('welcome.restrictedNotice', 'hint', 'Se você recebeu este link por engano, fale com a equipe responsável pelo workspace.')}
      </p>}
      {form.isVisible('welcome.title') && <h1 className="font-display text-4xl md:text-5xl font-black leading-tight">
        {titleParts ? <>{titleParts[0]}<span className="text-accent">{accentWord}</span>{titleParts.slice(1).join(accentWord)}</> : title}
      </h1>}
      {form.isVisible('welcome.subtitle') && <p className="mt-4 text-muted-foreground leading-relaxed">
        {form.textFor('welcome.subtitle', 'hint', 'Envie os dados, créditos e arquivos do seu próximo lançamento. A equipe revisa os metadados, prepara a distribuição e mantém você informado por e-mail.')}
      </p>}

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {cards.filter((card) => form.isVisible(card.key)).map(({ key, icon: Icon, title: cardTitle, desc }) => (
          <div key={key} className="sun-card rounded-2xl p-4">
            <div className="flex items-center gap-2 font-bold text-sm"><Icon className="h-4 w-4 text-accent" />{form.textFor(key, 'label', cardTitle)}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{form.textFor(key, 'hint', desc)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        {form.isVisible('welcome.startButton') && <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-8 h-12 text-base shadow-[4px_4px_0_0_rgba(81,35,20,0.25)]" onClick={onStart}>
          {form.textFor('welcome.startButton', 'label', 'Começar')} <ArrowRight className="ml-1 h-5 w-5" />
        </Button>}
        <div className="flex gap-4 text-sm">
          {resume && form.isVisible('welcome.resumeLink') && (
            <button className="font-semibold underline underline-offset-4 text-foreground/80 hover:text-foreground" onClick={onResume}>
              {form.textFor('welcome.resumeLink', 'label', 'Continuar meu rascunho')}
            </button>
          )}
          {form.isVisible('welcome.editLink') && <button className="font-semibold underline underline-offset-4 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            {form.textFor('welcome.editLink', 'label', 'Editar uma submissão enviada')}
          </button>}
        </div>
        {form.isVisible('welcome.privacyNote') && <p className="max-w-md text-[11px] leading-relaxed text-muted-foreground">
          {form.textFor('welcome.privacyNote', 'hint', 'Seus dados são usados apenas para analisar e operar o seu lançamento, conforme a política de privacidade. Antes de enviar, você revisa tudo e confirma uma declaração de veracidade.')}
        </p>}
      </div>
    </div>
  )
}

export type { StepId }
