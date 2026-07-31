import { Input } from '@/components/ui/input'
import { Field, StepHeader, inputCls } from './ui'
import { type useIntakeForm } from '@/hooks/useIntakeForm'

type F = ReturnType<typeof useIntakeForm>

export function Identificacao({ form, showErrors }: { form: F; showErrors: boolean }) {
  const e = showErrors ? form.errorsFor('identificacao') : {}
  return (
    <div className="mx-auto max-w-xl">
      <StepHeader
        title="Vamos começar?"
        description="Conta pra gente quem está por trás deste lançamento. Esses dados são só para a gente se manter em contato e te enviar atualizações."
      />
      <div className="space-y-6">
        {form.isVisible('responsibleName') ? <Field label={form.textFor('responsibleName', 'label', 'Seu nome')} required={form.isRequired('responsibleName')} error={e.responsibleName}
          hint={form.textFor('responsibleName', 'hint', 'Como você gostaria de ser chamado(a)?')}>
          <Input
            className={inputCls(!!e.responsibleName)}
            placeholder={form.textFor('responsibleName', 'placeholder', 'Ex.: Marina Duarte')}
            value={form.data.responsibleName}
            onChange={(ev) => form.setData('responsibleName', ev.target.value)}
          />
        </Field> : null}
        {form.isVisible('responsibleEmail') ? <Field label={form.textFor('responsibleEmail', 'label', 'Seu e-mail')} required={form.isRequired('responsibleEmail')} error={e.responsibleEmail}
          hint={form.textFor('responsibleEmail', 'hint', 'Por aqui a gente manda o resumo do envio, o link do rascunho e as novidades de cada etapa.')}>
          <Input
            type="email"
            className={inputCls(!!e.responsibleEmail)}
            placeholder={form.textFor('responsibleEmail', 'placeholder', 'voce@exemplo.com')}
            value={form.data.responsibleEmail}
            onChange={(ev) => form.setData('responsibleEmail', ev.target.value)}
          />
        </Field> : null}
      </div>
    </div>
  )
}
