import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Check, LockKeyhole } from 'lucide-react'
import { api } from '../lib/api'
import { SunbeatLogo } from '../components/SunbeatLogo'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
}

const COPY = {
  en: { eyebrow: 'Create your account', title: 'Start with a ready workspace.', intro: 'We will send a secure magic link to confirm your email and open MotoSchema onboarding.', name: 'Your name', email: 'Email', workspace: 'Company / label name', address: 'Workspace address', accept: 'I accept the', terms: 'Terms of Use', and: 'and', privacy: 'Privacy Policy', submit: 'Create my workspace', submitting: 'Creating workspace…', verify: 'Check your email', verifyBody: 'We sent a magic link. It expires in 30 minutes and opens your protected onboarding.', login: 'Already registered? Sign in', error: 'We could not create your workspace. Try again.' },
  pt: { eyebrow: 'Criar sua conta', title: 'Comece com um workspace pronto.', intro: 'Enviaremos um magic link seguro para confirmar seu e-mail e abrir o onboarding do MotoSchema.', name: 'Seu nome', email: 'E-mail', workspace: 'Nome da empresa / label', address: 'Endereço do workspace', accept: 'Aceito os', terms: 'Termos de Uso', and: 'e a', privacy: 'Política de Privacidade', submit: 'Criar meu workspace', submitting: 'Criando workspace…', verify: 'Verifique seu e-mail', verifyBody: 'Enviamos um magic link. Ele expira em 30 minutos e abre seu onboarding protegido.', login: 'Já tem cadastro? Entrar', error: 'Não foi possível criar seu workspace. Tente novamente.' },
} as const

export default function SignupPage() {
  const pt = window.location.hostname.endsWith('.com.br')
  const copy = pt ? COPY.pt : COPY.en
  const [params] = useSearchParams()
  const plan = ['starter', 'pro'].includes(params.get('plan') ?? '') ? params.get('plan') : null
  const [startedAt] = useState(() => Date.now())
  const [form, setForm] = useState({ name: '', email: '', workspace_name: '', company_website: '' })
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const domain = pt ? 'sunbeat.com.br' : 'sunbeat.pro'

  function change(event: React.ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError(null)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const response = await api.signup({ ...form, plan_intent: plan, terms_accepted: accepted, form_started_at: startedAt })
    setLoading(false)
    if (!response.ok) {
      setError(response.error ?? copy.error)
      return
    }
    setWorkspaceSlug(response.data?.workspace_slug ?? slugify(form.workspace_name))
    setSuccess(true)
  }

  return (
    <main className="min-h-screen bg-[#000e14] px-4 py-12 text-[#f5f0e5]">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mx-auto flex w-fit justify-center" aria-label="Sunbeat home">
          <SunbeatLogo className="h-11" />
        </Link>
        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#071b24] p-7 shadow-[0_24px_70px_rgba(0,0,0,.35)] sm:p-9">
          {success ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffb53e] text-[#001018]"><Check size={28} /></span>
              <h1 className="mt-6 text-3xl font-bold">{copy.verify}</h1>
              <p className="mt-3 text-sm leading-7 text-white/60">{copy.verifyBody}</p>
              <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-xs text-[#ffcf72]">{workspaceSlug}.{domain}</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb53e]">{copy.eyebrow}</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight">{copy.title}</h1>
              <p className="mt-3 text-sm leading-7 text-white/55">{copy.intro}</p>
              {plan ? <p className="mt-4 rounded-full bg-[#ffb53e]/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#ffcf72]">{plan} plan selected</p> : null}
              <form onSubmit={submit} className="mt-6 space-y-4">
                <Input name="name" label={copy.name} value={form.name} onChange={change} autoComplete="name" />
                <Input name="email" label={copy.email} value={form.email} onChange={change} type="email" autoComplete="email" />
                <Input name="workspace_name" label={copy.workspace} value={form.workspace_name} onChange={change} />
                <input name="company_website" value={form.company_website} onChange={change} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                {form.workspace_name ? <p className="text-xs text-white/40">{copy.address}: <span className="text-[#ffcf72]">{slugify(form.workspace_name)}.{domain}</span></p> : null}
                <label className="flex items-start gap-3 text-xs leading-5 text-white/60"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 accent-[#ffb53e]" /><span>{copy.accept} <Link to="/terms" target="_blank" rel="noreferrer" className="font-bold text-[#ffcf72] underline underline-offset-2">{copy.terms}</Link> {copy.and} <Link to="/privacy" target="_blank" rel="noreferrer" className="font-bold text-[#ffcf72] underline underline-offset-2">{copy.privacy}</Link>.</span></label>
                {error ? <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
                <button type="submit" disabled={loading || !accepted} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ffb53e] px-5 py-3.5 text-sm font-black text-[#001018] disabled:opacity-40"><LockKeyhole size={16} />{loading ? copy.submitting : copy.submit}</button>
              </form>
            </>
          )}
        </section>
        <Link to="/login" className="mt-6 block text-center text-xs font-semibold text-white/50 hover:text-white">{copy.login}</Link>
      </div>
    </main>
  )
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block text-xs font-bold uppercase tracking-[0.12em] text-white/65">{label}<input required {...props} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-[#ffb53e]" /></label>
}
