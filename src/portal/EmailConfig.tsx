import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import {
  api,
  type EmailConfigRemote,
  type EmailEventName,
} from '../lib/api'

const EVENTS: { key: EmailEventName; label: string; description: string }[] = [
  { key: 'on_draft', label: 'Link do rascunho', description: 'Quando a pessoa pede o link para continuar depois.' },
  { key: 'on_first_stage', label: 'Primeira etapa concluída', description: 'Quando a identificação é concluída e o formulário avança.' },
  { key: 'on_submit', label: 'Confirmação do envio', description: 'Confirmação enviada à pessoa responsável após o envio.' },
  { key: 'on_summary', label: 'Resumo para a equipe', description: 'Resumo interno da nova submissão.' },
  { key: 'on_edit', label: 'Submissão atualizada', description: 'Quando uma submissão existente é editada.' },
]

const SAMPLE: Record<string, string> = {
  submitter_name: 'Ana Souza',
  submitter_email: 'ana@exemplo.com',
  project_title: 'Novo Horizonte',
  release_date: '18/09/2026',
  release_type: 'Single',
  genre: 'MPB',
  primary_artist: 'Banda Horizonte',
  draft_link: 'https://sunbeat.pro/intake/exemplo?draft=abc123',
  edit_link: 'https://sunbeat.pro/intake/exemplo?edit_token=abc123',
  workspace_name: 'Atabaque',
  current_step: 'Projeto',
  tracks_count: '3',
  focus_track: 'Novo Horizonte',
  track_titles: 'Novo Horizonte, Maré, Amanhã',
}

function splitEmails(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,;]+/).map((item) => item.trim().toLowerCase()).filter(Boolean)))
}

function renderPreview(template: string): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (token, key: string) => SAMPLE[key] ?? token)
}

export function EmailConfig({ workspace }: { workspace: string }) {
  const [config, setConfig] = useState<EmailConfigRemote | null>(null)
  const [selected, setSelected] = useState<EmailEventName>('on_first_stage')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void api.getEmailConfig(workspace).then((result) => {
      if (cancelled) return
      setConfig(result)
      if (!result) setMessage({ ok: false, text: 'Não foi possível carregar a configuração. Entre novamente no portal.' })
    })
    return () => { cancelled = true }
  }, [workspace])

  const selectedMeta = EVENTS.find((event) => event.key === selected) ?? EVENTS[0]
  const preview = useMemo(() => {
    if (!config) return { subject: '', body: '' }
    return {
      subject: renderPreview(config.templates[selected].subject),
      body: renderPreview(config.templates[selected].body),
    }
  }, [config, selected])

  function updateEvent(patch: Partial<EmailConfigRemote['events'][EmailEventName]>) {
    setConfig((current) => current ? {
      ...current,
      events: { ...current.events, [selected]: { ...current.events[selected], ...patch } },
    } : current)
  }

  function updateTemplate(field: 'subject' | 'body', value: string) {
    setConfig((current) => current ? {
      ...current,
      templates: {
        ...current.templates,
        [selected]: { ...current.templates[selected], [field]: value },
      },
    } : current)
  }

  async function save() {
    if (!config) return
    const tooMany = EVENTS.some(({ key }) => config.events[key].recipients.length > 5)
      || config.cc_addresses.length > 5
      || config.bcc_addresses.length > 5
    if (tooMany) {
      setMessage({ ok: false, text: 'Use no máximo 5 endereços em cada lista.' })
      return
    }
    setSaving(true)
    setMessage(null)
    const result = await api.patchEmailConfig(workspace, {
      events: Object.fromEntries(EVENTS.map(({ key }) => [key, {
        enabled: config.events[key].enabled,
        recipients: config.events[key].recipients,
      }])),
      templates: Object.fromEntries(EVENTS.map(({ key }) => [key, {
        subject: config.templates[key].subject,
        body: config.templates[key].body,
      }])),
      cc_addresses: config.cc_addresses,
      bcc_addresses: config.bcc_addresses,
    })
    setSaving(false)
    if (!result) {
      setMessage({ ok: false, text: 'Não foi possível salvar. Confira os e-mails, placeholders e sua sessão.' })
      return
    }
    setConfig(result)
    setMessage({ ok: true, text: 'Configuração salva. Os próximos disparos já usarão estas regras.' })
  }

  if (!config) {
    return <div className="mt-6 text-sm text-[#512314]/60">Carregando configuração de e-mails…</div>
  }

  const inputClass = 'w-full rounded-2xl border border-[#512314]/25 bg-white/30 px-4 py-2.5 text-sm text-[#512314] outline-none focus:border-[#512314]/60'

  return (
    <div className="mt-6 space-y-5">
      <div className="sun-card p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 text-[#329fd7]" size={20} />
          <div>
            <h2 className="text-[15px] font-bold text-[#512314]">E-mails do intake</h2>
            <p className="mt-0.5 text-[12px] text-[#512314]/60">
              Defina quem recebe cada evento e personalize assunto e corpo. Campos vazios mantêm o template padrão da Sunbeat.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {EVENTS.map((event) => (
            <button
              key={event.key}
              onClick={() => setSelected(event.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                selected === event.key ? 'bg-[#512314] text-[#ebdbba]' : 'bg-[#512314]/8 text-[#512314]/70'
              }`}
            >
              {config.events[event.key].enabled ? '● ' : '○ '}{event.label}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-[#512314]/15 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#512314]">{selectedMeta.label}</h3>
              <p className="text-[12px] text-[#512314]/55">{selectedMeta.description}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#512314]">
              <input
                type="checkbox"
                checked={config.events[selected].enabled}
                onChange={(event) => updateEvent({ enabled: event.target.checked })}
                className="h-4 w-4 accent-[#512314]"
              />
              Ativo
            </label>
          </div>

          <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">
            Destinatários deste evento
          </label>
          <textarea
            rows={2}
            value={config.events[selected].recipients.join('\n')}
            onChange={(event) => updateEvent({ recipients: splitEmails(event.target.value) })}
            placeholder="equipe@empresa.com — um por linha ou separados por vírgula"
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1 text-[11px] text-[#512314]/45">Até 5 endereços. No e-mail de confirmação, entram como cópia interna.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Assunto personalizado</label>
              <input
                value={config.templates[selected].subject}
                onChange={(event) => updateTemplate('subject', event.target.value)}
                placeholder="Vazio = assunto padrão"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            <div className="md:row-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Prévia com dados fictícios</label>
              <div className="mt-1.5 min-h-36 rounded-2xl border border-[#512314]/15 bg-white/45 p-4 text-[12px] text-[#512314]">
                <p className="font-bold">{preview.subject || 'Assunto padrão da Sunbeat'}</p>
                <div className="mt-3 whitespace-pre-wrap break-words text-[#512314]/70">
                  {preview.body || 'O corpo padrão será usado para este evento.'}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Corpo em HTML</label>
              <textarea
                rows={7}
                value={config.templates[selected].body}
                onChange={(event) => updateTemplate('body', event.target.value)}
                placeholder="<p>Olá, {{submitter_name}}...</p> — vazio = template padrão"
                className={`${inputClass} mt-1.5 font-mono text-[12px]`}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Placeholders disponíveis</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {config.placeholders.map((placeholder) => (
                <code key={placeholder} className="rounded-md bg-[#512314]/8 px-2 py-1 text-[11px] text-[#512314]">
                  {'{{'}{placeholder}{'}}'}
                </code>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">CC global</label>
            <textarea rows={2} value={config.cc_addresses.join('\n')}
              onChange={(event) => setConfig({ ...config, cc_addresses: splitEmails(event.target.value) })}
              className={`${inputClass} mt-1.5`} placeholder="copia@empresa.com" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">BCC global</label>
            <textarea rows={2} value={config.bcc_addresses.join('\n')}
              onChange={(event) => setConfig({ ...config, bcc_addresses: splitEmails(event.target.value) })}
              className={`${inputClass} mt-1.5`} placeholder="auditoria@empresa.com" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#512314] px-6 py-2.5 text-sm font-bold text-[#ebdbba] transition hover:opacity-90 disabled:opacity-50">
            {saving ? 'Salvando…' : 'Salvar e-mails'}
          </button>
          {message && (
            <p className={`flex items-center gap-1.5 text-[12px] font-semibold ${message.ok ? 'text-[#166534]' : 'text-red-700'}`}>
              {message.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
