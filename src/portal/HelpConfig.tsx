import { useEffect, useState } from 'react'
import { CheckCircle2, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { api, type HelpConfigRemote, type HelpTopicRemote } from '../lib/api'

const EMPTY_TOPIC: HelpTopicRemote = { question: '', answer: '', keywords: [] }

export function HelpConfig({ workspace }: { workspace: string }) {
  const [config, setConfig] = useState<HelpConfigRemote | null>(null)
  const [published, setPublished] = useState<HelpConfigRemote | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    void api.getHelpConfig(workspace).then((result) => {
      if (!active) return
      setConfig(result)
      setPublished(result)
    })
    return () => { active = false }
  }, [workspace])

  if (!config) return <section className="sun-card p-5 text-sm text-[#512314]/60">Carregando área de dúvidas…</section>

  const changed = JSON.stringify(config) !== JSON.stringify(published)
  const patch = (values: Partial<HelpConfigRemote>) => {
    setConfig((current) => current ? { ...current, ...values } : current)
    setSaved(false)
  }
  const updateTopic = (index: number, values: Partial<HelpTopicRemote>) => {
    patch({ topics: config.topics.map((topic, itemIndex) => itemIndex === index ? { ...topic, ...values } : topic) })
  }

  async function save() {
    if (!config) return
    setSaving(true)
    const result = await api.patchHelpConfig(workspace, {
      enabled: config.enabled,
      button_label: config.button_label,
      title: config.title,
      subtitle: config.subtitle,
      welcome_message: config.welcome_message,
      fallback_message: config.fallback_message,
      topics: config.topics,
    })
    setSaving(false)
    if (!result) return
    setConfig(result)
    setPublished(result)
    setSaved(true)
  }

  return (
    <section className="sun-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 text-[#329fd7]" size={20} />
          <div>
            <h2 className="text-[15px] font-bold text-[#512314]">Área de dúvidas</h2>
            <p className="mt-0.5 max-w-2xl text-[12px] text-[#512314]/60">Configuração global do tenant. Quando oculta, o botão não aparece em nenhum formulário nem no portal.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-[#512314]/15 bg-white/45 px-4 py-2 text-[12px] font-bold text-[#512314]">
          <input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
          {config.enabled ? 'Visível' : 'Oculta'}
        </label>
      </div>

      <div className={`mt-5 space-y-4 ${config.enabled ? '' : 'opacity-55'}`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput label="Texto do botão" value={config.button_label} onChange={(button_label) => patch({ button_label })} />
          <TextInput label="Título" value={config.title} onChange={(title) => patch({ title })} />
          <TextInput label="Subtítulo" value={config.subtitle} onChange={(subtitle) => patch({ subtitle })} />
        </div>
        <TextArea label="Mensagem inicial" value={config.welcome_message} onChange={(welcome_message) => patch({ welcome_message })} />
        <TextArea label="Resposta quando não houver correspondência" value={config.fallback_message} onChange={(fallback_message) => patch({ fallback_message })} />

        <div className="border-t border-[#512314]/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-bold text-[#512314]">Perguntas e respostas sugeridas</h3>
              <p className="text-[11px] text-[#512314]/55">As quatro primeiras aparecem como atalhos. Palavras-chave localizam a resposta enquanto a pessoa digita.</p>
            </div>
            <button type="button" onClick={() => patch({ topics: [...config.topics, { ...EMPTY_TOPIC }] })}
              className="inline-flex items-center gap-1 rounded-full border border-[#512314]/20 px-3 py-1.5 text-[11px] font-bold text-[#512314]"><Plus size={13} /> Adicionar</button>
          </div>
          <div className="mt-3 space-y-3">
            {config.topics.map((topic, index) => (
              <article key={index} className="rounded-2xl border border-[#512314]/12 bg-white/35 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <TextInput label="Pergunta" value={topic.question} onChange={(question) => updateTopic(index, { question })} />
                  <TextInput label="Palavras-chave, separadas por vírgula" value={topic.keywords.join(', ')} onChange={(value) => updateTopic(index, { keywords: value.split(',').map((item) => item.trim()).filter(Boolean) })} />
                  <button type="button" aria-label="Excluir pergunta" onClick={() => patch({ topics: config.topics.filter((_, itemIndex) => itemIndex !== index) })}
                    className="mt-5 rounded-full p-2 text-red-700 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
                <div className="mt-3"><TextArea label="Resposta" value={topic.answer} onChange={(answer) => updateTopic(index, { answer })} /></div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!changed || saving} onClick={save}
          className="rounded-full bg-[#512314] px-5 py-2 text-[12px] font-bold text-[#ebdbba] disabled:opacity-40">{saving ? 'Salvando…' : 'Salvar área de dúvidas'}</button>
        {saved ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#166534]"><CheckCircle2 size={14} /> Configuração publicada</span> : null}
      </div>
    </section>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] font-normal normal-case text-[#512314]" /></label>
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">{label}<textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] font-normal normal-case text-[#512314]" /></label>
}
