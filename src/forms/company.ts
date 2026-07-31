import { Landmark, PenLine } from 'lucide-react'
import type { FormConfig } from '@/engine/types'

const REP_FIELDS = [
  { key: 'name', label: 'Nome completo', type: 'text', required: true },
  { key: 'phone', label: 'Telefone / WhatsApp', type: 'tel', required: true },
  { key: 'email', label: 'E-mail', type: 'email', required: true, validate: 'email' },
] as const

export const companyConfig: FormConfig = {
  slug: 'company-atabaque',
  clientName: 'Atabaque',
  chip: 'Atabaque · Cadastro de empresa',
  title: 'Cadastro de empresa',
  accentWord: 'empresa',
  subtitle:
    'Cadastre sua empresa para formalizar a parceria com a Atabaque. ' +
    'Esses dados alimentam contrato, financeiro e operação — preencha com calma, o rascunho salva sozinho.',
  estimate: '6–10 minutos',
  haveReady: 'CNPJ (ou CPF), endereço, dados dos responsáveis e dados bancários.',
  welcomeCards: [
    { icon: PenLine, title: 'Responsáveis flexíveis', desc: 'Contrato e financeiro podem ser a mesma pessoa do responsável legal — sem redigitar.' },
    { icon: Landmark, title: 'Uso contratual', desc: 'As informações formalizam a parceria contratual, financeira e operacional.' },
  ],
  steps: [
    {
      id: 'empresa', label: 'Empresa', hint: 'Dados fiscais',
      title: 'Dados da empresa',
      description: 'Informações fiscais e de endereço — como constam no cartão CNPJ.',
      fields: [
        {
          key: 'document_type', label: 'Tipo de documento', type: 'radio', required: true,
          options: [
            { label: 'CNPJ (pessoa jurídica)', value: 'cnpj' },
            { label: 'CPF (pessoa física)', value: 'cpf' },
          ],
        },
        { key: 'document_number', label: 'Número do documento (CPF ou CNPJ)', type: 'text', required: true },
        { key: 'fantasy_name', label: 'Nome fantasia', type: 'text', required: true },
        { key: 'legal_name', label: 'Razão social', type: 'text', required: true },
        { key: 'address', label: 'Endereço (logradouro, número, complemento)', type: 'text', required: true },
        { key: 'city', label: 'Cidade', type: 'text', required: true },
        { key: 'state', label: 'Estado (UF)', type: 'text', required: true, placeholder: 'Ex.: PE' },
        { key: 'zip_code', label: 'CEP', type: 'text', required: true },
      ],
    },
    {
      id: 'legal', label: 'Resp. legal', hint: 'Quem assina',
      title: 'Responsável legal',
      description: 'Quem representa a empresa legalmente — base para os demais responsáveis.',
      fields: REP_FIELDS.map((f) => ({ ...f, key: `legalrep_${f.key}` })),
    },
    {
      id: 'contrato', label: 'Contrato', hint: 'Contato contratual',
      title: 'Responsável pelo contrato',
      description: 'Quem acompanha a parte contratual. Se for o responsável legal, pulamos os campos.',
      fields: [
        { key: 'contract_same_as_legal', label: 'Mesmo que o responsável legal?', type: 'yesno', required: true },
        ...REP_FIELDS.map((f) => ({
          ...f,
          key: `contract_${f.key}`,
          visibleWhen: [{ key: 'contract_same_as_legal', equals: 'no' }],
        })),
      ],
    },
    {
      id: 'financeiro', label: 'Financeiro', hint: 'Pagamentos',
      title: 'Responsável financeiro',
      description: 'Quem cuida de pagamentos, notas e repasses.',
      fields: [
        { key: 'financial_same_as_legal', label: 'Mesmo que o responsável legal?', type: 'yesno', required: true },
        {
          key: 'financial_same_as_contract', label: 'Mesmo que o responsável pelo contrato?', type: 'yesno', required: true,
          visibleWhen: [{ key: 'financial_same_as_legal', equals: 'no' }],
        },
        ...REP_FIELDS.map((f) => ({
          ...f,
          key: `financial_${f.key}`,
          visibleWhen: [
            { key: 'financial_same_as_legal', equals: 'no' },
            { key: 'financial_same_as_contract', equals: 'no' },
          ],
        })),
      ],
    },
    {
      id: 'bancario', label: 'Bancário', hint: 'Conta para repasse',
      title: 'Dados bancários',
      description: 'Conta para repasses e pagamentos da operação.',
      fields: [
        { key: 'bank_name', label: 'Banco', type: 'text', required: true },
        { key: 'agency', label: 'Agência', type: 'text', required: true },
        { key: 'account', label: 'Conta (com dígito)', type: 'text', required: true },
        {
          key: 'account_type', label: 'Tipo de conta', type: 'radio', required: true,
          options: [
            { label: 'Conta corrente', value: 'corrente' },
            { label: 'Conta poupança', value: 'poupanca' },
          ],
        },
        { key: 'pix_key', label: 'Chave Pix (opcional)', type: 'text' },
      ],
    },
  ],
  sampleEdit: {
    document_type: 'cnpj',
    document_number: '12.345.678/0001-90',
    fantasy_name: 'Selva',
    legal_name: 'Selva Produções Artísticas LTDA',
    address: 'Rua da Aurora, 425, sala 2',
    city: 'Recife',
    state: 'PE',
    zip_code: '50050-000',
    legalrep_name: 'Marina Duarte',
    legalrep_phone: '+55 81 98888-0000',
    legalrep_email: 'marina@selva.rec.br',
    contract_same_as_legal: 'yes',
    financial_same_as_legal: 'no',
    financial_same_as_contract: 'no',
    financial_name: 'Carlos Menezes',
    financial_phone: '+55 81 97777-0000',
    financial_email: 'financeiro@selva.rec.br',
    bank_name: 'Banco do Brasil',
    agency: '1234-5',
    account: '67890-1',
    account_type: 'corrente',
    pix_key: 'financeiro@selva.rec.br',
    consentTruth: true,
  },
  successHeading: 'Cadastro enviado! 🎉',
  successLead: 'O cadastro da empresa entrou na fila de formalização da Atabaque.',
  successSteps: [
    { title: 'Confirmação imediata', desc: 'E-mail com o resumo do cadastro e link para editar.' },
    { title: 'Conferência dos dados', desc: 'A equipe valida dados fiscais, responsáveis e conta bancária.' },
    { title: 'Formalização', desc: 'Aprovado, o cadastro alimenta contrato, financeiro e operação.' },
  ],
  restartLabel: 'Cadastrar outra empresa',
}
