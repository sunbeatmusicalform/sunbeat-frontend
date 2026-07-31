import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Lock, ArrowRight } from 'lucide-react'

/* /portal — entrada neutra Sunbeat (multi-tenant).
   Cada operação tem sua própria área em /portal/:workspace; aqui nenhuma
   marca de cliente aparece. */
export default function PortalIndex() {
  const [slug, setSlug] = useState('')
  const navigate = useNavigate()

  function go(e: React.FormEvent) {
    e.preventDefault()
    const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (s) navigate(`/portal/${s}`)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#000e14]/10 bg-white p-8 text-center shadow-sm">
        <p className="font-display text-xl font-black tracking-tight text-[#000e14]">
          sunbeat<span className="text-[#fbbb1e]">.</span>
        </p>
        <h1 className="mt-4 text-lg font-bold text-[#000e14]">Área do cliente</h1>
        <p className="mt-1.5 text-sm text-[#000e14]/55">
          Cada operação tem sua área exclusiva e protegida. Acesse pelo link enviado
          pela Sunbeat ou digite o código da sua operação.
        </p>
        <form onSubmit={go} className="mt-5 flex gap-2">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="código da operação"
            autoFocus
            className="w-full rounded-2xl border border-[#000e14]/20 bg-transparent px-4 py-2.5 text-sm text-[#000e14] outline-none focus:border-[#000e14]/60"
          />
          <button
            type="submit"
            disabled={!slug.trim()}
            className="flex items-center gap-1 rounded-2xl bg-[#000e14] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Ir <ArrowRight size={14} />
          </button>
        </form>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#000e14]/40">
          <Lock size={11} /> Acesso monitorado pela Sunbeat
        </p>
      </div>
    </div>
  )
}
