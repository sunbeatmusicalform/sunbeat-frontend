import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowDown } from 'lucide-react'
import { BeachScene } from '@/components/BeachScene'
import { IntelligentForms, Showcase } from '@/sections/Info'
import { ChatDemo } from '@/sections/ChatDemo'

const INTEGRATIONS = ['Airtable', 'Google Drive', 'Notion', 'Slack', 'Gmail', 'Sheets', 'Asana', 'Webhooks']

export default function Landing() {
  const navigate = useNavigate()

  // links antigos de edição apontavam para a raiz com ?edit_token=... — redireciona para o intake
  useEffect(() => {
    const qs = window.location.search
    if (qs.includes('edit_token=') || qs.includes('draft_token=')) {
      navigate(`/intake/atabaque${qs}`, { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#000e14] text-[#f5eeda]">
      {/* ===== HERO — vinheta ===== */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0">
          <BeachScene />
          <img
            src="/hero-beach.jpg"
            alt="Golden sun setting over a calm tropical beach"
            className="kenburns absolute inset-0 h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-[#000e14]" />
        </div>

        <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
          <img
            src="/brand/logo-horizontal.svg"
            alt="Sunbeat"
            className="h-10 w-auto drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]"
          />
          <div className="flex items-center gap-5">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.35em] text-white/60 md:block">
              Intelligent infrastructure for creative markets
            </span>
            <Link to="/portal" className="text-xs font-bold text-white/70 transition-colors hover:text-[#fbbb1e]">
              Área do cliente
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="dawn-in dawn-1 font-display text-5xl leading-[1.06] drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)] md:text-7xl">
            Your creative operation,<br />in perfect sync.
          </h1>
          <p className="dawn-in dawn-3 mt-7 font-display text-2xl text-[#fbbb1e] drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] md:text-3xl">
            Sunbeat keeps it flowing.
          </p>
        </div>

        <a href="#forms" className="relative z-10 mx-auto mb-10 flex flex-col items-center gap-2 text-white/45 transition-colors hover:text-[#fbbb1e]">
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* ===== área informativa — leitura direta ===== */}
      <div id="forms"><IntelligentForms /></div>

      {/* ===== vitrine ===== */}
      <Showcase />

      {/* ===== chat incorporado ===== */}
      <section id="chat" className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="story-kicker">The door in</p>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-4xl">
              Start with a conversation.
            </h2>
            <p className="mt-5 leading-relaxed text-white/60">
              Ask anything. Subscribe to a plan. Configure your operation.
              The same conversation generates your intake, your stage emails
              and your integrations — right here, inside the page.
            </p>
            <p className="mt-8 text-sm text-white/45">
              <span className="font-bold text-white/80">Free</span> to start ·
              <span className="font-bold text-white/80"> $19</span> Starter ·
              <span className="font-bold text-white/80"> $49</span> Pro ·
              <span className="text-white/35"> Enterprise from $199</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold text-white/35">
              {INTEGRATIONS.map((i) => <span key={i}>{i}</span>)}
            </div>
          </div>
          <ChatDemo />
        </div>
      </section>

      {/* ===== footer ===== */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-16 text-center">
          <img src="/brand/logo-stacked.svg" alt="Sunbeat" className="h-28 w-auto" />
          <p className="text-[11px] text-white/25">© 2026 Sunbeat · Intelligent infrastructure for creative markets</p>
        </div>
      </footer>
    </div>
  )
}
