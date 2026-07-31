import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SendHorizonal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Msg {
  from: 'user' | 'sun'
  text?: string
  plans?: boolean
}

const PLANS = [
  { name: 'Free', price: '$0', note: 'Test your intake workflow', items: '50 submissions/mo · 1 form' },
  { name: 'Starter', price: '$19/mo', note: 'Steady operation', items: '500 submissions/mo · Airtable 2-way', hot: true },
  { name: 'Pro', price: '$49/mo', note: 'Full operation', items: '2,000 submissions/mo · AI + white-label' },
]

const SCRIPT: Record<string, { answer: string; plans?: boolean; followups: string[] }> = {
  'What is Sunbeat?': {
    answer:
      'Sunbeat turns scattered requests into a clear flow. Describe your operation here in the chat — I generate a tailored intake form with your branding, automatic file checks (audio, artwork, metadata) and stage-by-stage emails, all synced with Airtable, Google Drive and the tools you already use.',
    followups: ['How do I set up my operation?', 'How much does it cost?'],
  },
  'How do I set up my operation?': {
    answer:
      'A ~5 minute conversation: tell me what kind of requests you receive (releases, briefs, approvals), which fields matter and where the data should land. I generate the form, the stage emails and the integrations. No code, no config spreadsheets.',
    followups: ['How much does it cost?', 'What is MotorSchema?'],
  },
  'How much does it cost?': {
    answer:
      'Start free and scale as your operation grows. No sales call — you can subscribe right here in the chat:',
    plans: true,
    followups: ['What is MotorSchema?'],
  },
  'What is MotorSchema?': {
    answer:
      'Our core technology: an engine that turns your description into a living schema — fields, validation rules, automations and integrations. When your operation changes, just talk to me and the schema evolves with it. Your intake never falls behind.',
    followups: ['How much does it cost?', 'How do I set up my operation?'],
  },
}

const FIRST_PROMPTS = Object.keys(SCRIPT)

export function ChatDemo({ compact = false }: { compact?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'sun', text: "Hi! I'm Sunbeat. ☀️ Tell me about your creative operation — or pick a question below to start." },
  ])
  const [typing, setTyping] = useState(false)
  const [used, setUsed] = useState<string[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  const lastSun = [...msgs].reverse().find((m) => m.from === 'sun' && m.text)?.text
  const lastFollowups = Object.values(SCRIPT).find((s) => s.answer === lastSun)?.followups ?? []
  const chips = [...new Set([...FIRST_PROMPTS.filter((p) => !used.includes(p)), ...lastFollowups])].filter((p) => !used.includes(p))

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  function ask(prompt: string) {
    const entry = SCRIPT[prompt]
    if (!entry) return
    setUsed((u) => [...u, prompt])
    setMsgs((m) => [...m, { from: 'user', text: prompt }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { from: 'sun', text: entry.answer, plans: entry.plans }])
    }, 1300)
  }

  return (
    <div className={cn(
      'mx-auto w-full overflow-hidden border border-white/10 bg-[#061a24]/90 shadow-[0_0_80px_rgba(255,223,76,0.08)] backdrop-blur flex flex-col',
      compact ? 'h-full rounded-2xl' : 'max-w-2xl rounded-3xl'
    )}>
      {!compact && (
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-3.5">
          <img src="/brand/icon-512.png" alt="" className="h-6 w-8 object-contain" />
          <div>
            <div className="text-sm font-bold">Sunbeat</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> online — sets up your operation in minutes
            </div>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-[#fbbb1e]" />
        </div>
      )}

      <div ref={bodyRef} className={cn('flex-1 space-y-4 overflow-y-auto px-5 py-5', !compact && 'min-h-[380px] max-h-[420px]')}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${m.from === 'user' ? 'bg-[#fbbb1e] text-[#000e14] rounded-br-md font-medium' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>
              {m.text}
              {m.plans && (
                <div className="mt-3 grid gap-2">
                  {PLANS.map((p) => (
                    <div key={p.name} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${p.hot ? 'border-[#fbbb1e]/50 bg-[#fbbb1e]/10' : 'border-white/10 bg-black/30'}`}>
                      <div>
                        <div className="font-bold">{p.name} <span className="text-[#fbbb1e]">{p.price}</span></div>
                        <div className="text-xs text-white/50">{p.note} · {p.items}</div>
                      </div>
                      <Button size="sm" className="bg-[#fbbb1e] text-[#000e14] hover:bg-[#fbbb1e]/90 font-bold shrink-0">
                        Subscribe
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-white/10 px-4 py-3.5">
              <span className="typing-dot h-2 w-2 rounded-full bg-white/50" />
              <span className="typing-dot h-2 w-2 rounded-full bg-white/50" />
              <span className="typing-dot h-2 w-2 rounded-full bg-white/50" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        {chips.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button key={c} onClick={() => ask(c)}
                className="rounded-full border border-[#fbbb1e]/40 bg-[#fbbb1e]/5 px-3.5 py-1.5 text-xs font-semibold text-[#fbbb1e] transition-colors hover:bg-[#fbbb1e]/15">
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
          <input
            placeholder="Tell me about your operation..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            onKeyDown={(e) => { if (e.key === 'Enter') ask(FIRST_PROMPTS[used.length % FIRST_PROMPTS.length]) }}
          />
          <SendHorizonal className="h-4 w-4 shrink-0 text-[#fbbb1e]" />
        </div>
        {!compact && (
          <p className="mt-2 text-center text-[11px] text-white/40">
            Prototype — in the product, this conversation configures your intake, stage emails and integrations.
          </p>
        )}
      </div>
    </div>
  )
}
