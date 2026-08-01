import { Building2, UserRound } from 'lucide-react'
import type { FormConfig } from '@/engine/types'

export const peopleConfig: FormConfig = {
  slug: 'people-atabaque',
  clientName: 'Atabaque',
  chip: 'Atabaque · People Registry',
  title: 'Cadastro de pessoas',
  accentWord: 'pessoas',
  subtitle:
    'Cadastre artistas, produtores, contatos e empresas do ecossistema do projeto. ' +
    'O cadastro alimenta contratos, créditos e pagamentos — por isso a deduplicação é automática.',
  estimate: '5–8 minutos',
  haveReady: 'Documento (CPF ou CNPJ) ou e-mail — ao menos um dos dois é necessário para a deduplicação.',
  welcomeCards: [
    { icon: UserRound, title: 'PF ou PJ', desc: 'Pessoa Física e Pessoa Jurídica no mesmo fluxo, com campos que se adaptam.' },
    { icon: Building2, title: 'Sem duplicados', desc: 'Se o documento ou e-mail já existe, o sistema aponta o cadastro existente em vez de criar outro.' },
  ],
  steps: [
    {
      id: 'identificacao', label: 'Identificação', hint: 'Quem é',
      title: 'Identificação',
      description: 'Dados principais do cadastro. O tipo (PF ou PJ) ajusta os campos automaticamente.',
      fields: [
        {
          key: 'party_kind', label: 'Tipo de cadastro', type: 'radio', required: true,
          options: [
            { label: 'Pessoa Física', value: 'pf' },
            { label: 'Pessoa Jurídica', value: 'pj' },
          ],
        },
        {
          key: 'display_name', label: 'Nome de exibição', type: 'text', required: true,
          placeholder: 'Como essa pessoa aparece nos projetos',
          visibleWhen: [{ key: 'party_kind', equals: 'pf' }],
        },
        {
          key: 'display_name_pj', label: 'Nome / marca', type: 'text', required: true,
          visibleWhen: [{ key: 'party_kind', equals: 'pj' }],
        },
        {
          key: 'legal_name', label: 'Nome legal', type: 'text', required: true,
          visibleWhen: [{ key: 'party_kind', equals: 'pf' }],
        },
        {
          key: 'legal_name_pj', label: 'Razão social', type: 'text', required: true,
          visibleWhen: [{ key: 'party_kind', equals: 'pj' }],
        },
        {
          key: 'stage_name', label: 'Nome artístico', type: 'text',
          visibleWhen: [{ key: 'party_kind', equals: 'pf' }],
        },
        {
          key: 'trade_name', label: 'Nome fantasia', type: 'text',
          visibleWhen: [{ key: 'party_kind', equals: 'pj' }],
        },
        {
          key: 'document_id', label: 'CPF', type: 'text',
          hint: 'CPF ou e-mail — ao menos um é necessário para a deduplicação.',
          placeholder: '000.000.000-00',
          visibleWhen: [{ key: 'party_kind', equals: 'pf' }],
        },
        {
          key: 'document_id_pj', label: 'CNPJ', type: 'text',
          hint: 'CNPJ ou e-mail — ao menos um é necessário para a deduplicação.',
          placeholder: '00.000.000/0000-00',
          visibleWhen: [{ key: 'party_kind', equals: 'pj' }],
        },
        {
          key: 'roles', label: 'Funções', type: 'chips', required: true,
          hint: 'Selecione todas as que se aplicam.',
          options: [
            { label: 'Artista', value: 'artista' },
            { label: 'Produtor(a)', value: 'produtor' },
            { label: 'Compositor(a)', value: 'compositor' },
            { label: 'Letrista', value: 'letrista' },
            { label: 'Intérprete', value: 'interprete' },
            { label: 'Sócio(a)', value: 'socio' },
            { label: 'Assessor(a)', value: 'assessor' },
            { label: 'Gravadora', value: 'gravadora' },
            { label: 'Distribuidora', value: 'distribuidora' },
            { label: 'Editora', value: 'editora' },
            { label: 'Contato', value: 'contato' },
            { label: 'Outros', value: 'outros' },
          ],
        },
        {
          key: 'roles_other', label: 'Qual função?', type: 'text', required: true,
          hint: 'Descreva a função — o cadastro acomoda qualquer papel da operação.',
          placeholder: 'Ex.: técnico de som, fotógrafo(a), designer, roadie…',
          visibleWhen: [{ key: 'roles', contains: 'outros' }],
        },
      ],
    },
    {
      id: 'contato', label: 'Contato', hint: 'Como falar',
      title: 'Contato',
      description: 'Canais de comunicação — o e-mail também serve para a deduplicação.',
      customValidate: (v): Record<string, string> => {
        const doc = String(v.document_id || v.document_id_pj || '').trim()
        const email = String(v.email_primary ?? '').trim()
        if (doc || email) return {}
        return { document_or_email: 'Informe CPF/CNPJ ou e-mail — ao menos um é necessário para a deduplicação.' }
      },
      fields: [
        { key: 'email_primary', label: 'E-mail', type: 'email', validate: 'email', hint: 'CPF/CNPJ ou e-mail — ao menos um é obrigatório.' },
        { key: 'phone_primary', label: 'Telefone / WhatsApp', type: 'tel' },
        { key: 'website', label: 'Site', type: 'text', placeholder: 'https://' },
        { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@usuario' },
      ],
    },
    {
      id: 'endereco', label: 'Endereço', hint: 'Onde fica',
      title: 'Endereço',
      description: 'Usado em contratos e documentos fiscais.',
      fields: [
        { key: 'country', label: 'País', type: 'text' },
        { key: 'state_region', label: 'Estado / UF', type: 'text' },
        { key: 'city', label: 'Cidade', type: 'text' },
        { key: 'postal_code', label: 'CEP', type: 'text' },
        { key: 'address_line_1', label: 'Endereço', type: 'text' },
      ],
    },
    {
      id: 'bancario', label: 'Dados bancários', hint: 'Pagamentos',
      title: 'Dados bancários',
      description: 'Para pagamentos de direitos, splits e repasses.',
      fields: [
        { key: 'pix_key', label: 'Chave Pix', type: 'text' },
        { key: 'bank_name', label: 'Banco', type: 'text' },
        { key: 'bank_agency', label: 'Agência', type: 'text' },
        { key: 'account_number', label: 'Número da conta', type: 'text' },
        { key: 'account_holder_name', label: 'Titular', type: 'text' },
        { key: 'account_holder_document_id', label: 'CPF/CNPJ do titular', type: 'text' },
      ],
    },
    {
      id: 'adicionais', label: 'Informações', hint: 'Contexto extra',
      title: 'Informações adicionais',
      description: 'Vínculos e observações internas.',
      fields: [
        { key: 'manager_name', label: 'Assessor / Manager', type: 'text' },
        { key: 'label_name', label: 'Gravadora / Editora', type: 'text' },
        { key: 'notes_internal', label: 'Observações', type: 'textarea' },
      ],
    },
  ],
  sampleEdit: {
    party_kind: 'pf',
    display_name: 'Alaíde Tropical',
    legal_name: 'Alaíde Costa Nascimento',
    stage_name: 'Alaíde Tropical',
    document_id: '123.456.789-00',
    roles: ['artista', 'compositor'],
    email_primary: 'alaide@selva.rec.br',
    phone_primary: '+55 81 90000-0000',
    instagram: '@alaide.tropical',
    country: 'Brasil',
    state_region: 'PE',
    city: 'Recife',
    consentTruth: true,
  },
  successHeading: 'Cadastro recebido! 🎉',
  successLead: 'O cadastro entrou na base de pessoas da Atabaque.',
  successSteps: [
    { title: 'Confirmação imediata', desc: 'E-mail com o resumo do cadastro e link para editar.' },
    { title: 'Deduplicação automática', desc: 'O sistema verifica documento e e-mail na base antes de criar o registro.' },
    { title: 'Disponível nos projetos', desc: 'A pessoa já pode ser vinculada a créditos, contratos e splits.' },
  ],
  restartLabel: 'Cadastrar outra pessoa',
}
