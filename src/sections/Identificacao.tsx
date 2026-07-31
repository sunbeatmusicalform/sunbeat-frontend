import { Input } from '@/components/ui/input'
import { Field, StepHeader, inputCls } from './ui'
import { fieldErrors, type useIntakeForm } from '@/hooks/useIntakeForm'

type F = ReturnType<typeof useIntakeForm>

export function Identificacao({ form, showErrors }: { form: F; showErrors: boolean }) {
  const e = showErrors ? fieldErrors('identificacao', form.data) : {}
  return (
    <div className="mx-auto max-w-xl">
      <StepHeader
        title="Vamos começar?"
        description="Conta pra gente quem está por trás deste lançamento. Esses dados são só para a gente se manter em contato e te enviar atualizações."
      />
      <div className="space-y-6">
        <Field label="Seu nome" required error={e.responsibleName}
          hint="Como você gostaria de ser chamado(a)?">
          <Input
            className={inputCls(!!e.responsibleName)}
            placeholder="Ex.: Marina Duarte"
            value={form.data.responsibleName}
            onChange={(ev) => form.setData('responsibleName', ev.target.value)}
          />
        </Field>
        <Field label="Seu e-mail" required error={e.responsibleEmail}
          hint="Por aqui a gente manda o resumo do envio, o link do rascunho e as novidades de cada etapa.">
          <Input
            type="email"
            className={inputCls(!!e.responsibleEmail)}
            placeholder="voce@exemplo.com"
            value={form.data.responsibleEmail}
            onChange={(ev) => form.setData('responsibleEmail', ev.target.value)}
          />
        </Field>
      </div>
    </div>
  )
}
