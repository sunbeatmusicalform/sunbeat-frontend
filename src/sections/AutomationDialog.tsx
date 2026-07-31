import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Mail, Table2, HardDrive, Workflow, MessageSquareText, FileAudio, Image as ImageIcon } from 'lucide-react'

const FLOWS = [
  {
    icon: MessageSquareText, title: 'Configurado por chat', color: '#329fd7',
    desc: 'Este formulário é gerado pela Sunbeat AI a partir de uma conversa com o cliente: campos, regras, textos de ajuda e branding (este usa o manual de marca da Atabaque).',
  },
  {
    icon: FileAudio, title: 'Análise de áudio WAV', color: '#ff5639',
    desc: 'Cada faixa anexada é analisada na hora: duração, sample rate, bit depth e canais — com aviso imediato se estiver fora do padrão das plataformas.',
  },
  {
    icon: ImageIcon, title: 'Avaliação da capa', color: '#ffb53e',
    desc: 'A capa é verificada automaticamente: formato quadrado, resolução mínima de 1500 px e compatibilidade por distribuidora.',
  },
  {
    icon: Mail, title: 'Triggers de e-mail por etapa', color: '#ff5639',
    desc: 'Resend dispara e-mails transacionais a cada mudança de status: Recebido → Em análise → Ajustes necessários → Aprovado → Distribuído.',
  },
  {
    icon: Table2, title: 'Airtable (2-way sync)', color: '#329fd7',
    desc: 'Cada submissão vira um registro na base do cliente; mudanças de status no Airtable atualizam o acompanhamento e disparam os e-mails.',
  },
  {
    icon: HardDrive, title: 'Google Drive', color: '#ffb53e',
    desc: 'Áudios e capas são organizados automaticamente na pasta do projeto, com nomenclatura padronizada.',
  },
]

export function AutomationDialog({
  open, onOpenChange, whiteLabel, onWhiteLabelChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  whiteLabel: boolean
  onWhiteLabelChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#ebdbba] border-2 border-foreground/15">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black flex items-center gap-2">
            <Workflow className="h-5 w-5 text-accent" /> Automações deste formulário
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            O intake não para no envio — ele dispara um fluxo operacional completo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {FLOWS.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex gap-3 rounded-2xl border-2 border-foreground/10 bg-white/60 p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: color + '26' }}>
                <Icon className="h-4.5 w-4.5 h-5 w-5" style={{ color }} />
              </div>
              <div>
                <div className="font-bold text-sm">{title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-foreground/10 bg-white/60 p-3.5">
          <div>
            <Label htmlFor="wl" className="font-bold text-sm">Branding Sunbeat no rodapé</Label>
            <p className="text-xs text-muted-foreground">
              Visível nos planos Free e Starter. Oculto automaticamente a partir do Pro (white-label).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{whiteLabel ? 'Oculto (Pro)' : 'Visível'}</span>
            <Switch id="wl" checked={!whiteLabel} onCheckedChange={(v) => onWhiteLabelChange(!v)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
