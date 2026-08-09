import { useEffect, useRef, useState } from 'react'
import { MessageCircleQuestion, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, type HelpConfigRemote } from '@/lib/api'

/* Assistente operacional com respostas controladas por assunto. */

interface Msg { from: 'user' | 'bot'; text: string }

const SUGGESTED = [
  'Qual formulário devo usar?',
  'Como os dados são protegidos?',
  'Onde ficam arquivos e cadastros?',
  'Quem consegue acessar?',
]

const RULES: { keys: string[]; answer: string }[] = [
  {
    keys: ['qual formulário', 'qual formulario', 'intake ou', 'clearance ou', 'people ou', 'company ou'],
    answer: 'Use Lançamentos (intake) para cadastrar singles, EPs, álbuns, faixas, créditos e assets. Use Clearance para pedidos e autorizações de direitos. Pessoas cadastra artistas, produtores e contatos; Empresas cadastra pessoas jurídicas, responsáveis e dados operacionais.',
  },
  {
    keys: ['segurança', 'seguranca', 'proteg', 'vazamento', 'criptograf', 'senha', 'lgpd', 'privacidade'],
    answer: 'A operação da Atabaque é separada por tenant e o portal exige uma sessão de acesso. O tráfego usa HTTPS; senhas técnicas e chaves de Airtable, Drive, Supabase, e-mail e IA ficam no servidor, em secrets, e não são entregues ao navegador. Registros e arquivos seguem apenas para as integrações configuradas da Atabaque. O acesso dentro de Airtable e Drive continua obedecendo às permissões administradas pela própria Atabaque.',
  },
  {
    keys: ['quem acessa', 'quem consegue', 'acesso aos dados', 'ver meus dados', 'compartilh'],
    answer: 'No portal, apenas pessoas com acesso da Atabaque. No fluxo técnico, os dados passam somente pelos serviços necessários à operação: Sunbeat/Fly para executar o sistema, Supabase para dados operacionais, Airtable e Google Drive configurados da Atabaque e Resend para e-mails. Nenhuma chave dessas integrações aparece para quem preenche o formulário.',
  },
  {
    keys: ['onde ficam', 'onde estão', 'onde estao', 'airtable', 'drive', 'pasta dos arquivos', 'cadastro'],
    answer: 'Os dados estruturados alimentam as tabelas configuradas no Airtable da Atabaque. Capas, áudios e materiais seguem a lógica de pastas do Google Drive da Atabaque, organizados pelo cliente/artista e pelo projeto. A Sunbeat mantém apenas os dados operacionais necessários para rascunho, vínculo, auditoria e sincronização do fluxo.',
  },
  {
    keys: ['clearance', 'direito', 'licença', 'licenca', 'titularidade', 'sync'],
    answer: 'O formulário de Clearance organiza solicitante, contexto, faixas, titulares, territórios, prazo de licenciamento e materiais de apoio. Ele reduz pedidos incompletos e entrega o caso estruturado para análise da equipe responsável.',
  },
  {
    keys: ['people', 'pessoa', 'artista', 'convite', 'contato'],
    answer: 'O formulário Pessoas cadastra artistas, produtores e contatos com deduplicação. No intake, a busca tenta localizar o cadastro existente; nomes semelhantes só são vinculados após confirmação. Se não existir, pode ser aberto um convite de cadastro.',
  },
  {
    keys: ['company', 'empresa', 'cnpj', 'bancário', 'bancario'],
    answer: 'O formulário Empresas reúne dados jurídicos, responsáveis e informações operacionais necessárias a contratos e financeiro, mantendo o cadastro separado do formulário de pessoas.',
  },
  {
    keys: ['timestamp', 'inteligência artificial', 'inteligencia artificial', 'gemini', 'ia de letra'],
    answer: 'A IA de letras só processa áudio e letra quando a função de timestamps é acionada. O resultado é uma sugestão revisável, nunca uma publicação automática. Esse recurso está oculto no formulário atual da Atabaque.',
  },
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
    answer: 'Os dados são usados para operar o fluxo solicitado, com aviso de confidencialidade e consentimento na revisão. Pedidos formais de acesso, correção ou exclusão devem ser encaminhados à equipe responsável da Atabaque e da Sunbeat para tratamento conforme a política aplicável.',
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

function botAnswer(q: string, fallback?: string): string {
  const lower = q.toLowerCase()
  const hit = RULES.find((r) => r.keys.some((k) => lower.includes(k)))
  return hit
    ? hit.answer
    : fallback || 'Posso ajudar com lançamento, clearance, cadastro de pessoas e empresas, portal, Airtable, Drive, e-mails e segurança dos dados. Tente mencionar qual fluxo ou etapa gerou a dúvida; questões contratuais ou jurídicas devem ser confirmadas com a equipe responsável.'
}

export function HelpChat({ clientName, workspaceSlug }: { clientName: string; workspaceSlug: string }) {
  const [config, setConfig] = useState<HelpConfigRemote | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open])

  useEffect(() => {
    let active = true
    void api.getHelpConfig(workspaceSlug).then((result) => {
      if (!active) return
      setConfig(result)
      setMsgs(result ? [{ from: 'bot', text: result.welcome_message }] : [])
      setLoaded(true)
    })
    return () => { active = false }
  }, [workspaceSlug])

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    const lower = t.toLowerCase()
    const custom = config?.topics.find((topic) =>
      topic.question.toLowerCase() === lower || topic.keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
    )
    setMsgs((m) => [...m, { from: 'user', text: t }, { from: 'bot', text: custom?.answer ?? botAnswer(t, config?.fallback_message) }])
    setInput('')
  }

  if (!loaded || !config?.enabled) return null

  const suggested = config.topics.slice(0, 4).map((topic) => topic.question)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background shadow-[3px_3px_0_0_rgba(81,35,20,0.25)] transition hover:scale-[1.03]"
      >
        <MessageCircleQuestion className="h-4 w-4" /> {config.button_label}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border-2 border-foreground/15 bg-background shadow-[8px_8px_0_0_rgba(81,35,20,0.18)]">
          <div className="flex items-center justify-between border-b-2 border-foreground/10 px-4 py-3">
            <div>
              <p className="text-sm font-black">{config.title.replace('{cliente}', clientName)}</p>
              <p className="text-[11px] text-muted-foreground">{config.subtitle}</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-foreground/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.from === 'bot' ? 'bg-card/70 text-foreground' : 'ml-auto bg-foreground text-background'
              }`}>
                {m.text}
              </div>
            ))}
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(suggested.length ? suggested : SUGGESTED).map((s) => (
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
              className="h-9 flex-1 rounded-full border-2 border-foreground/15 bg-card/60 px-3.5 text-[13px] outline-none focus:border-foreground/40"
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
