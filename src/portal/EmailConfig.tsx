import { useEffect, useMemo, useRef, useState } from 'react'
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

const WORKFLOWS = [
  { value: 'release_intake', label: 'Intake de lançamento' },
  { value: 'rights_clearance', label: 'Clearance de direitos' },
  { value: 'people_registry', label: 'Cadastro de pessoas' },
  { value: 'company_registry', label: 'Cadastro de empresa' },
] as const

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

const PLACEHOLDER_LABELS: Record<string, string> = {
  submitter_name: 'Nome do responsável',
  submitter_email: 'E-mail do responsável',
  project_title: 'Nome do projeto',
  release_date: 'Data de lançamento',
  release_type: 'Tipo de lançamento',
  genre: 'Gênero',
  primary_artist: 'Artista principal',
  draft_link: 'Link do rascunho',
  edit_link: 'Link de edição',
  workspace_name: 'Nome da empresa',
  current_step: 'Etapa atual',
  tracks_count: 'Quantidade de faixas',
  focus_track: 'Faixa foco',
  track_titles: 'Nomes das faixas',
}

function splitEmails(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,;]+/).map((item) => item.trim().toLowerCase()).filter(Boolean)))
}

function renderPreview(template: string): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (token, key: string) => SAMPLE[key] ?? token)
}

export function EmailConfig({ workspace }: { workspace: string }) {
  const [workflowType, setWorkflowType] = useState<(typeof WORKFLOWS)[number]['value']>('release_intake')
  const [config, setConfig] = useState<EmailConfigRemote | null>(null)
  const [selected, setSelected] = useState<EmailEventName>('on_first_stage')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [activeTemplateField, setActiveTemplateField] = useState<'subject' | 'body'>('body')
  const [bodyMode, setBodyMode] = useState<'visual' | 'html'>('visual')
  const [bodyEditorVersion, setBodyEditorVersion] = useState(0)
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const richBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void api.getEmailConfig(workspace, workflowType).then((result) => {
      if (cancelled) return
      setConfig(result)
      if (!result) setMessage({ ok: false, text: 'Não foi possível carregar a configuração. Entre novamente no portal.' })
    })
    return () => { cancelled = true }
  }, [workspace, workflowType])

  useEffect(() => {
    setBodyMode('visual')
    setBodyEditorVersion((version) => version + 1)
  }, [selected, workflowType])

  const selectedMeta = EVENTS.find((event) => event.key === selected) ?? EVENTS[0]
  const preview = useMemo(() => {
    if (!config) return { subject: '', body: '' }
    const template = config.templates[selected]
    return {
      subject: renderPreview(template.subject || template.default_subject),
      body: renderPreview(template.body || template.default_body),
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

  function insertTemplateText(field: 'subject' | 'body', insertion: string, suffix = '') {
    if (!config) return
    if (field === 'body' && bodyMode === 'visual' && richBodyRef.current) {
      richBodyRef.current.focus()
      document.execCommand('insertText', false, insertion)
      updateTemplate('body', richBodyRef.current.innerHTML)
      return
    }
    const element = field === 'subject' ? subjectRef.current : bodyRef.current
    const template = config.templates[selected]
    const current = template[field] || (field === 'subject' ? template.default_subject_template : template.default_body_template)
    const start = element?.selectionStart ?? current.length
    const end = element?.selectionEnd ?? start
    const selectedText = current.slice(start, end)
    const next = `${current.slice(0, start)}${insertion}${selectedText}${suffix}${current.slice(end)}`
    updateTemplate(field, next)
    requestAnimationFrame(() => {
      element?.focus()
      const cursor = start + insertion.length + selectedText.length + suffix.length
      element?.setSelectionRange(cursor, cursor)
    })
  }

  function formatRichBody(command: 'bold' | 'formatBlock' | 'insertHTML', value?: string) {
    richBodyRef.current?.focus()
    document.execCommand(command, false, value)
    if (richBodyRef.current) updateTemplate('body', richBodyRef.current.innerHTML)
  }

  function restoreSystemDefault(field: 'subject' | 'body') {
    if (!config) return
    setConfig({
      ...config,
      templates: {
        ...config.templates,
        [selected]: { ...config.templates[selected], [field]: '' },
      },
    })
    if (field === 'body') setBodyEditorVersion((version) => version + 1)
    setMessage({ ok: true, text: `${field === 'subject' ? 'O assunto' : 'O corpo'} padrão será usado após salvar.` })
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
    }, workflowType)
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
          <Mail className="mt-0.5 text-[#329fd7]" size={20} />
          <div>
            <h2 className="text-[15px] font-bold text-[#512314]">E-mails do intake</h2>
            <p className="mt-0.5 text-[12px] text-[#512314]/60">
              Defina quem recebe cada evento e personalize assunto e corpo. Campos vazios mantêm o template atual do sistema.
            </p>
          </div>
          </div>
          <label className="min-w-56 text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">
            Formulário
            <select value={workflowType} onChange={(event) => {
              setConfig(null); setMessage(null)
              setWorkflowType(event.target.value as typeof workflowType)
            }}
              className="mt-1 block w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] font-semibold normal-case text-[#512314]">
              {WORKFLOWS.map((workflow) => <option key={workflow.value} value={workflow.value}>{workflow.label}</option>)}
            </select>
          </label>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Assunto do e-mail</label>
                <span className="rounded-full bg-[#512314]/8 px-2 py-1 text-[10px] font-semibold text-[#512314]/60">
                  {config.templates[selected].subject || config.templates[selected].body ? 'Personalizado' : 'Usando padrão atual'}
                </span>
              </div>
              <input
                ref={subjectRef}
                value={config.templates[selected].subject || config.templates[selected].default_subject_template}
                onChange={(event) => updateTemplate('subject', event.target.value)}
                onFocus={() => setActiveTemplateField('subject')}
                placeholder="Assunto do e-mail"
                className={`${inputClass} mt-1.5`}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => restoreSystemDefault('subject')}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-[#512314]/60 underline underline-offset-2">
                  Restaurar assunto padrão
                </button>
              </div>
            </div>
            <div className="md:row-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Prévia do e-mail efetivo</label>
              <div className="mt-1.5 overflow-hidden rounded-2xl border border-[#512314]/15 bg-white/65 p-4 text-[12px] text-[#512314]">
                <p className="font-bold">{preview.subject || 'Este evento não possui assunto padrão.'}</p>
                {preview.body ? (
                  <iframe
                    title="Prévia do corpo do e-mail"
                    sandbox=""
                    srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font:13px/1.55 Arial,sans-serif;color:#512314}table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:4px 8px 4px 0;vertical-align:top}td:first-child{color:#8a6a5d;width:38%}a{color:#2563eb;overflow-wrap:anywhere}p{margin:0 0 10px}ul{padding-left:18px}</style></head><body>${preview.body}</body></html>`}
                    className="mt-3 h-64 w-full border-0 bg-transparent"
                  />
                ) : <p className="mt-3 text-[#512314]/60">Este evento não possui um disparo padrão neste formulário.</p>}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Corpo do e-mail</label>
                <div className="flex rounded-full bg-[#512314]/8 p-0.5 text-[10px] font-semibold">
                  <button type="button" onClick={() => { setBodyMode('visual'); setBodyEditorVersion((version) => version + 1) }}
                    className={`rounded-full px-2.5 py-1 ${bodyMode === 'visual' ? 'bg-white/80 text-[#512314]' : 'text-[#512314]/55'}`}>Editor visual</button>
                  <button type="button" onClick={() => setBodyMode('html')}
                    className={`rounded-full px-2.5 py-1 ${bodyMode === 'html' ? 'bg-white/80 text-[#512314]' : 'text-[#512314]/55'}`}>HTML avançado</button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-[#512314]/50">Clique diretamente no texto abaixo e altere somente o que precisar.</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#512314]/15 bg-white/35 p-2">
                {bodyMode === 'visual' ? <>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichBody('formatBlock', 'p')}
                    className="rounded-lg bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-[#512314]">Parágrafo</button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichBody('bold')}
                    className="rounded-lg bg-white/60 px-2.5 py-1 text-[11px] font-bold text-[#512314]">Negrito</button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichBody('insertHTML', '<br>')}
                    className="rounded-lg bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-[#512314]">Quebra de linha</button>
                </> : <span className="px-1 text-[11px] text-[#512314]/50">Edição direta do código do template.</span>}
                <button type="button" onClick={() => restoreSystemDefault('body')}
                  className="ml-auto rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#512314]/60 underline underline-offset-2">Restaurar corpo padrão</button>
              </div>
              {bodyMode === 'visual' ? (
                <div
                  key={`${workflowType}-${selected}-${bodyEditorVersion}`}
                  ref={richBodyRef}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setActiveTemplateField('body')}
                  onInput={(event) => updateTemplate('body', event.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: config.templates[selected].body || config.templates[selected].default_body_template }}
                  className="mt-1.5 min-h-64 max-h-[28rem] overflow-y-auto rounded-2xl border border-[#512314]/25 bg-white/65 p-4 text-[13px] leading-relaxed text-[#512314] outline-none focus:border-[#512314]/60 [&_a]:text-blue-700 [&_p]:mb-2.5 [&_table]:my-3 [&_table]:w-full [&_td]:py-1 [&_td:first-child]:w-[38%] [&_td:first-child]:text-[#512314]/60"
                />
              ) : (
                <textarea
                  ref={bodyRef}
                  rows={12}
                  value={config.templates[selected].body || config.templates[selected].default_body_template}
                  onChange={(event) => updateTemplate('body', event.target.value)}
                  onFocus={() => setActiveTemplateField('body')}
                  className={`${inputClass} mt-1.5 font-mono text-[12px]`}
                />
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Informações dinâmicas</p>
              <p className="text-[11px] text-[#512314]/50">Clique para inserir no {activeTemplateField === 'subject' ? 'assunto' : 'corpo'}.</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {config.placeholders.map((placeholder) => (
                <button key={placeholder} type="button"
                  title={`Insere {{${placeholder}}}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertTemplateText(activeTemplateField, `{{${placeholder}}}`)}
                  className="rounded-full border border-[#512314]/15 bg-[#512314]/8 px-2.5 py-1.5 text-[11px] font-semibold text-[#512314] transition hover:bg-[#512314]/15">
                  + {PLACEHOLDER_LABELS[placeholder] ?? placeholder}
                </button>
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
