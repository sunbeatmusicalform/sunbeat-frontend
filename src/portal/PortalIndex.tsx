import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Lock, ArrowRight } from 'lucide-react'
import { SunbeatLogo } from '../components/SunbeatLogo'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

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
    <main className="flex min-h-screen items-center bg-[#000e14] px-4 py-12 text-[#f5f0e5]">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mx-auto flex w-fit justify-center" aria-label="Sunbeat home">
          <SunbeatLogo className="h-11" />
        </Link>
        <Card className="mt-8 gap-0 rounded-[30px] border-white/10 bg-[#071b24] py-0 text-[#f5f0e5] shadow-[0_24px_70px_rgba(0,0,0,.35)]">
          <CardHeader className="gap-3 px-7 pb-0 pt-8 sm:px-9 sm:pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb53e]">Acesso protegido</p>
            <CardTitle className="text-3xl font-bold leading-tight">Área do cliente</CardTitle>
            <CardDescription className="text-sm leading-7 text-white/55">
              Cada operação tem sua área exclusiva e protegida. Acesse pelo link enviado
              pela Sunbeat ou digite o código da sua operação.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-8 pt-6 sm:px-9 sm:pb-9">
            <form onSubmit={go} className="flex gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="código da operação"
                aria-label="Código da operação"
                autoFocus
                className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 focus-visible:border-[#ffb53e] focus-visible:ring-[#ffb53e]/20"
              />
              <Button
                type="submit"
                disabled={!slug.trim()}
                className="h-12 rounded-2xl bg-[#ffb53e] px-5 font-black text-[#001018] hover:bg-[#ffbf55]"
              >
                Ir <ArrowRight size={14} />
              </Button>
            </form>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <Lock size={11} /> Acesso monitorado pela Sunbeat
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
