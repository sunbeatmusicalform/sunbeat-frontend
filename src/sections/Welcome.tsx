import { Button } from '@/components/ui/button'
import { ArrowRight, FileAudio, Image as ImageIcon, Mail, Clock3 } from 'lucide-react'
import type { StepId } from '@/hooks/useIntakeForm'

export function Welcome({
  onStart, onResume, onEdit, hasDraft,
}: {
  onStart: () => void
  onResume: () => void
  onEdit: () => void
  hasDraft: boolean
}) {
  const resume = hasDraft && onResume
  return (
    <div className="mx-auto max-w-2xl text-center py-10">
      <div className="sun-chip mx-auto mb-3">Atabaque · Um Ritmo de Pensar Música</div>
      <p className="mb-6 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
        🔒 Formulário restrito a parceiros — se você chegou aqui por engano, fale com a equipe Atabaque.
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-black leading-tight">
        Formulário de <span className="text-accent">lançamento</span>
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Envie os dados, créditos e arquivos do seu próximo lançamento. Nossa equipe revisa,
        valida os metadados e prepara a distribuição — você acompanha tudo por e-mail.
      </p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {[
          { icon: Clock3, t: '10–15 minutos', d: 'E salva rascunho automaticamente — volte quando quiser.' },
          { icon: FileAudio, t: 'Tenha em mãos', d: 'Áudios em WAV ou FLAC, capa quadrada (ideal 3000×3000) e créditos completos.' },
          { icon: ImageIcon, t: 'Validação automática', d: 'Analisamos áudio e capa na hora e avisamos se algo precisa de ajuste.' },
          { icon: Mail, t: 'Acompanhamento', d: 'Você recebe e-mails a cada etapa: recebido, em análise, ajustes e aprovado.' },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="sun-card rounded-2xl p-4">
            <div className="flex items-center gap-2 font-bold text-sm"><Icon className="h-4 w-4 text-accent" />{t}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-8 h-12 text-base shadow-[4px_4px_0_0_rgba(81,35,20,0.25)]" onClick={onStart}>
          Começar <ArrowRight className="ml-1 h-5 w-5" />
        </Button>
        <div className="flex gap-4 text-sm">
          {resume && (
            <button className="font-semibold underline underline-offset-4 text-foreground/80 hover:text-foreground" onClick={onResume}>
              Continuar meu rascunho
            </button>
          )}
          <button className="font-semibold underline underline-offset-4 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            Editar uma submissão enviada
          </button>
        </div>
        <p className="max-w-md text-[11px] leading-relaxed text-muted-foreground">
          Seus dados são usados apenas para analisar e operar o seu lançamento, conforme a política de
          privacidade. Antes de enviar, você revisa tudo e confirma uma declaração de veracidade.
        </p>
      </div>
    </div>
  )
}

export type { StepId }
