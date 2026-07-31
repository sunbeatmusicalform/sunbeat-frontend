import { useEffect, useRef, useState } from 'react'
import { MessageCircleQuestion, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* Chat de dúvidas para quem está preenchendo o formulário.
   Protótipo: respostas locais por palavra-chave; em produção vira o chat Sunbeat
   configurado por cliente (mesma IA que configura o formulário). */

interface Msg { from: 'user' | 'bot'; text: string }

const SUGGESTED = [
  'Quais formatos de áudio são aceitos?',
  'Posso continuar depois?',
  'Como edito uma submissão enviada?',
  'Para quem vão meus dados?',
]

const RULES: { keys: string[]; answer: string }[] = [
  {
    keys: ['áudio', 'audio', 'wav', 'mp3', 'formato'],
    answer: 'Para masters, o ideal é WAV 44.1kHz/24bit. MP3 só é aceito como referência. Se o arquivo estiver fora do padrão, a análise automática te avisa na hora e sugere o ajuste.',
  },
  {
    keys: ['continuar', 'depois', 'rascunho', 'salvar'],
    answer: 'Sim! Cada etapa salva rascunho automaticamente neste navegador. Para retomar, abra o formulário e toque em "Continuar meu rascunho" na tela inicial.',
  },
  {
    keys: ['editar', 'edit', 'alterar', 'corrigir'],
    answer: 'Depois de enviada, a submissão pode ser editada pelo link que chega no seu e-mail de confirmação — ou pela opção "Editar uma submissão enviada" na tela inicial. Cada edição é registrada e a equipe é avisada.',
  },
  {
    keys: ['dados', 'privacidade', 'lgpd', 'compartilh'],
    answer: 'Seus dados são usados apenas para operar este fluxo e ficam restritos à equipe do cliente, conforme o aviso de confidencialidade. Antes de enviar, você revisa tudo e confirma a declaração de veracidade.',
  },
  {
    keys: ['capa', 'imagem', 'arte'],
    answer: 'A capa precisa ser quadrada, mínimo 1500×1500 px — o ideal é 3000×3000. A verificação automática compara o arquivo com os padrões de cada distribuidora.',
  },
  {
    keys: ['prazo', 'demora', 'quando', 'análise'],
    answer: 'Você recebe um e-mail a cada mudança de etapa: recebido, em análise, ajustes (se necessário) e aprovado. O acompanhamento é automático — não precisa cobrar por aqui.',
  },
]

function botAnswer(q: string): string {
  const lower = q.toLowerCase()
  const hit = RULES.find((r) => r.keys.some((k) => lower.includes(k)))
  return hit
    ? hit.answer
    : 'Boa pergunta! Ainda estou aprendendo sobre este formulário. Se preferir, escreva para a equipe responsável — o contato está no e-mail de confirmação de envio.'
}

export function HelpChat({ clientName }: { clientName: string }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: `Oi! Sou o assistente deste formulário. Posso ajudar com dúvidas sobre o preenchimento — o que você precisa?` },
  ])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open])

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => [...m, { from: 'user', text: t }, { from: 'bot', text: botAnswer(t) }])
    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background shadow-[3px_3px_0_0_rgba(81,35,20,0.25)] transition hover:scale-[1.03]"
      >
        <MessageCircleQuestion className="h-4 w-4" /> Dúvidas?
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border-2 border-foreground/15 bg-background shadow-[8px_8px_0_0_rgba(81,35,20,0.18)]">
          <div className="flex items-center justify-between border-b-2 border-foreground/10 px-4 py-3">
            <div>
              <p className="text-sm font-black">Assistente {clientName}</p>
              <p className="text-[11px] text-muted-foreground">respostas sobre este formulário</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-foreground/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.from === 'bot' ? 'bg-white/70 text-foreground' : 'ml-auto bg-foreground text-background'
              }`}>
                {m.text}
              </div>
            ))}
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-full border-2 border-foreground/15 px-3 py-1 text-[11px] font-semibold text-foreground/75 transition hover:border-foreground/40">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t-2 border-foreground/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Escreva sua dúvida…"
              className="h-9 flex-1 rounded-full border-2 border-foreground/15 bg-white/60 px-3.5 text-[13px] outline-none focus:border-foreground/40"
            />
            <Button size="sm" className="h-9 w-9 rounded-full bg-accent p-0 text-accent-foreground" onClick={() => send(input)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
