import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Mail } from 'lucide-react'
import { api } from '../lib/api'

const COPY = {
  en: { eyebrow: 'Secure access', title: 'Sign in with a magic link.', intro: 'Enter the owner email. If it is registered, we will send a 30-minute access link.', email: 'Email', submit: 'Send magic link', sending: 'Sending…', sent: 'Check your email. If the address is registered, the access link is on its way.', signup: 'Create a new workspace', invalid: 'This link is invalid or has expired. Request a new one.', used: 'This link has already been used. Request a new one.', access: 'This link does not grant access to that workspace.', error: 'The email could not be sent. Try again.' },
  pt: { eyebrow: 'Acesso seguro', title: 'Entre com um magic link.', intro: 'Informe o e-mail do proprietário. Se estiver cadastrado, enviaremos um link de acesso válido por 30 minutos.', email: 'E-mail', submit: 'Enviar magic link', sending: 'Enviando…', sent: 'Verifique seu e-mail. Se o endereço estiver cadastrado, o link já está a caminho.', signup: 'Criar um novo workspace', invalid: 'Este link é inválido ou expirou. Solicite um novo.', used: 'Este link já foi utilizado. Solicite um novo.', access: 'Este link não concede acesso a esse workspace.', error: 'Não foi possível enviar o e-mail. Tente novamente.' },
} as const

export default function LoginPage() {
  const copy = window.location.hostname.endsWith('.com.br') ? COPY.pt : COPY.en
  const [params] = useSearchParams()
  const linkError = params.get('error')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(
    linkError === 'used_link' ? copy.used
      : linkError === 'workspace_access' ? copy.access
        : linkError ? copy.invalid : null,
  )

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const response = await api.requestMagicLink(email)
    setLoading(false)
    if (!response.ok) {
      setError(response.error ?? copy.error)
      return
    }
    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center bg-[#000e14] px-4 py-12 text-[#f5f0e5]">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="block text-center text-sm font-black uppercase tracking-[0.24em]">Sunbeat<span className="text-[#ffb53e]">.</span></Link>
        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#071b24] p-8 shadow-[0_24px_70px_rgba(0,0,0,.35)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb53e]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold">{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-white/55">{copy.intro}</p>
          {sent ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-200">{copy.sent}</p> : (
            <form onSubmit={submit} className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-white/65">{copy.email}<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-[#ffb53e]" /></label>
              {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
              <button type="submit" disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#ffb53e] px-5 py-3.5 text-sm font-black text-[#001018] disabled:opacity-50"><Mail size={16} />{loading ? copy.sending : copy.submit}</button>
            </form>
          )}
        </section>
        <Link to="/signup" className="mt-6 block text-center text-xs font-semibold text-white/50 hover:text-white">{copy.signup}</Link>
      </div>
    </main>
  )
}
