import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, Table2, HardDrive, Sparkles } from 'lucide-react'

export function Sucesso({ email, project, onRestart }: { email: string; project: string; onRestart: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-600/40">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="font-display text-4xl font-black">Recebido! 🎉</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        <strong>{project || 'Seu lançamento'}</strong> entrou na fila de revisão da equipe responsável.
        Enviamos o resumo para <strong>{email}</strong>.
      </p>

      <div className="mt-8 space-y-3 text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">O que acontece agora</p>
        {[
          { icon: Mail, t: 'Confirmação imediata', d: 'E-mail com o resumo do envio e link para editar.' },
          { icon: Sparkles, t: 'Análise em até 2 dias úteis', d: 'Validamos metadados, créditos, áudio e capa. Se algo precisar de ajuste, você recebe um e-mail com o que corrigir.' },
          { icon: Table2, t: 'Distribuição agendada', d: 'Aprovado, cadastramos nas plataformas e confirmamos por e-mail com as datas.' },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="sun-card flex gap-3 rounded-2xl p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <div className="font-bold text-sm">{t}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <HardDrive className="h-3.5 w-3.5" /> Arquivos já organizados no Drive do projeto
      </div>

      <Button variant="outline" className="mt-8 rounded-full border-2 font-bold" onClick={onRestart}>
        Enviar outro lançamento
      </Button>
    </div>
  )
}
