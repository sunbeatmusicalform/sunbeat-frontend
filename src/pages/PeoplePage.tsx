import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router'
import { Link2 } from 'lucide-react'
import { FormShell } from '@/engine/FormShell'
import { peopleConfig } from '@/forms/people'
import { findInvite, INVITE_STATUS_LABEL, markInviteResponded, type PeopleInvite } from '@/forms/invites'
import { buildInviteEnvelope, submitPerson, submitPersonEdit, type InviteStructural } from '@/forms/peopleAdapter'
import { api } from '@/lib/api'
import { AtabaqueMark } from '@/components/AtabaqueMark'

/* /people — modo normal (cadastro geral) ou modo convite contextual (?invite=token),
   replicando a frente People Links do Codex: o convite nasce de uma parte de
   clearance e abre o formulário pré-preenchido com o contexto do caso.
   Com a API habilitada, o convite é resolvido no backend (GET /people-invites/{token})
   e o submit responde o convite remoto (POST .../respond) — o mock local é o fallback. */
export default function PeoplePage() {
  const { workspace = 'atabaque' } = useParams()
  const [params] = useSearchParams()
  const token = params.get('invite')
  const editToken = params.get('edit_token')
  const intakeName = params.get('name')?.trim() ?? ''
  const intakeRole = params.get('role')?.trim() ?? ''
  const intakePrefill = useMemo(() => intakeName ? {
    party_kind: 'pf',
    display_name: intakeName,
    stage_name: intakeName,
    roles: intakeRole ? [intakeRole] : ['artista'],
  } : undefined, [intakeName, intakeRole])
  const localInvite = useMemo(() => findInvite(token), [token])
  const [remoteInvite, setRemoteInvite] = useState<PeopleInvite | null | undefined>(undefined)
  // estruturais do envelope (mapping PR #37): vêm do convite remoto; fallback local
  const [structural, setStructural] = useState<InviteStructural>({
    workspace_slug: 'atabaque',
    profile: 'atabaque_people_v1',
  })
  const [editPrefill, setEditPrefill] = useState<Record<string, unknown> | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    if (!editToken) return
    void fetch(`/people-registry/records/edit/${encodeURIComponent(editToken)}`).then(async (response) => {
      if (!response.ok) throw new Error('Este link ainda não foi autorizado ou foi substituído.')
      const payload = await response.json() as { data?: Record<string, Record<string, unknown>> }
      const data = payload.data ?? {}
      setEditPrefill({
        ...(data.party ?? {}), ...(data.contact ?? {}), ...(data.address ?? {}),
        ...(data.banking ?? {}), ...(data.additional_info ?? {}), consentTruth: true,
      })
    }).catch((reason: Error) => setEditError(reason.message))
  }, [editToken])

  useEffect(() => {
    let cancelled = false
    if (!token) return
    ;(async () => {
      const r = await api.getInvite(token)
      if (cancelled) return
      if (r?.ok && r.invite) {
        const inv = r.invite
        const ctx = (inv.context ?? {}) as Record<string, string>
        const done = inv.status === 'submitted' || inv.status === 'submitted_pending_airtable'
        setStructural({ workspace_slug: inv.workspace_slug, profile: inv.profile })
        setRemoteInvite({
          token: inv.token,
          status: done ? 'respondido' : 'aberto',
          parte: ctx.parte ?? ctx.target_name ?? '',
          papel: ctx.papel ?? ctx.musical_role ?? 'Parte',
          caso: ctx.caso ?? ctx.case_name ?? 'Caso de clearance',
          casoId: inv.airtable_clearance_part_id ?? '—',
          projeto: ctx.projeto ?? ctx.project ?? '',
          faixa: ctx.faixa ?? ctx.track,
          criadoEm: inv.created_at ?? '',
          prefill: {},
        })
      } else {
        setRemoteInvite(null)
      }
    })()
    return () => { cancelled = true }
  }, [token])

  // backend respondeu (ou está checando) tem precedência; sem API, vale o mock local
  const invite = token && remoteInvite !== undefined ? (remoteInvite ?? localInvite) : localInvite
  const checkingRemote = !!token && remoteInvite === undefined

  if (token && !invite && !checkingRemote) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="sun-card max-w-md rounded-3xl p-8 text-center">
          <div className="flex justify-center"><AtabaqueMark size={40} /></div>
          <h1 className="mt-4 font-display text-2xl font-black">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este convite de cadastro não é válido ou já expirou. Peça um novo link à equipe Atabaque
            ou cadastre-se pelo formulário padrão.
          </p>
          <Link to="/people/atabaque" className="mt-5 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background">
            Abrir cadastro padrão
          </Link>
        </div>
      </div>
    )
  }

  if (editToken && editError) return <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm font-semibold text-red-700">{editError}</div>
  if (editToken && !editPrefill) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando cadastro autorizado…</div>

  if (!invite) return (
    <FormShell
      config={peopleConfig}
      workspaceSlug={workspace}
      workflowType="people_registry"
      prefill={editPrefill ?? intakePrefill}
      initialMode={editToken ? 'edit' : 'new'}
      onSubmit={(values) => (editToken
        ? submitPersonEdit(values, { workspace_slug: workspace, profile: 'atabaque_people_v1' }, editToken)
        : submitPerson(values, { workspace_slug: workspace, profile: 'atabaque_people_v1' })).then(() => undefined)}
    />
  )

  const banner = (
    <div className="mb-6 rounded-2xl border-2 border-[#329fd7]/40 bg-[#329fd7]/10 p-4">
      <p className="flex items-center gap-2 text-[13px] font-bold text-[#1f6f9e]">
        <Link2 className="h-4 w-4" /> Cadastro com contexto — clearance
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#512314]/80">
        Você foi indicado como <strong>{invite.papel}</strong> no caso{' '}
        <strong>{invite.caso}</strong> ({invite.casoId}) do projeto{' '}
        <strong>{invite.projeto}</strong>{invite.faixa ? ` · ${invite.faixa}` : ''}.
        Ao concluir, seu cadastro é vinculado automaticamente à parte correspondente do caso.
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">
        convite {invite.token} · {INVITE_STATUS_LABEL[invite.status]} · criado em {invite.criadoEm}
      </p>
    </div>
  )

  return (
    <FormShell
      config={peopleConfig}
      workspaceSlug={structural.workspace_slug || workspace}
      workflowType="people_registry"
      prefill={invite.prefill}
      banner={banner}
      onSubmit={async (values) => {
        const result = await api.respondInvite(invite.token, buildInviteEnvelope(values, structural))
        if (!result?.ok) throw new Error('Não foi possível concluir este convite. Confira o link e tente novamente.')
        markInviteResponded(invite.token)
      }}
    />
  )
}
