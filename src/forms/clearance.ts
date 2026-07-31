import { FileCheck2, MessagesSquare } from 'lucide-react'
import type { FormConfig } from '@/engine/types'

const TRACK_SUBFIELDS = [
  { key: 'title', label: 'Título da faixa', type: 'text', required: true, placeholder: 'Ex.: Ciranda Elétrica' },
  { key: 'primary_artists', label: 'Artistas principais', type: 'text', required: true },
  { key: 'authors', label: 'Autores / compositores', type: 'text', required: true },
  { key: 'publishers', label: 'Editoras', type: 'text' },
  { key: 'phonogram_owner', label: 'Titular do fonograma', type: 'text', required: true },
  { key: 'has_isrc', label: 'Já possui ISRC?', type: 'yesno', required: true },
  {
    key: 'isrc_code', label: 'Código ISRC', type: 'text', required: true,
    placeholder: 'Ex.: BRABC2600001',
    visibleWhen: [{ key: 'has_isrc', equals: 'yes' }],
  },
  { key: 'notes_for_clearance', label: 'Observações para o clearance', type: 'textarea' },
] as const

export const clearanceConfig: FormConfig = {
  slug: 'clearance-atabaque',
  clientName: 'Atabaque',
  chip: 'Atabaque · Rights Clearance',
  title: 'Clearance de direitos',
  accentWord: 'direitos',
  subtitle:
    'Compartilhe o contexto do pedido, o formato de clearance e os materiais de apoio. ' +
    'A equipe avalia titularidade, território, prazos e responde com os próximos passos.',
  estimate: '8–12 minutos',
  haveReady: 'Título, artistas, titulares, território, período de licenciamento e referências do material.',
  welcomeCards: [
    { icon: FileCheck2, title: 'Três formatos', desc: 'Lançamento musical com faixas, projeto musical / faixa avulsa, ou audiovisual / sync.' },
    { icon: MessagesSquare, title: 'Resposta orientada', desc: 'O pedido chega organizado para a equipe de clearance — sem troca de e-mails soltos.' },
  ],
  steps: [
    {
      id: 'solicitante', label: 'Solicitante', hint: 'Quem está pedindo',
      title: 'Quem está solicitando',
      description: 'Identificação de quem faz o pedido — usamos para o retorno e o registro do clearance.',
      fields: [
        { key: 'requester_name', label: 'Nome do solicitante', type: 'text', required: true },
        { key: 'requester_email', label: 'E-mail do solicitante', type: 'email', required: true, validate: 'email' },
        { key: 'requester_company', label: 'Empresa do solicitante', type: 'text', required: true },
        { key: 'requester_role', label: 'Cargo ou papel no projeto', type: 'text', required: true },
      ],
    },
    {
      id: 'formato', label: 'Formato', hint: 'Tipo de clearance',
      title: 'Formato do pedido',
      description: 'O formato define os campos das próximas etapas — o formulário se adapta sozinho.',
      fields: [
        {
          key: 'clearance_format', label: 'Qual formato de rights clearance você precisa preencher?',
          type: 'radio', required: true,
          options: [
            { label: 'Lançamento musical / projeto + faixas', value: 'music_release_clearance_intake' },
            { label: 'Projeto musical / faixa', value: 'music_project_track' },
            { label: 'Audiovisual / produto / videoclipe / sync', value: 'audiovisual_product_sync' },
          ],
        },
      ],
    },
    {
      id: 'contexto', label: 'Contexto', hint: 'O projeto',
      title: 'Contexto do projeto',
      description: 'O enquadramento geral do pedido — datas, responsáveis e associações comerciais.',
      fields: [
        { key: 'project_title', label: 'Título do projeto', type: 'text', required: true },
        { key: 'responsible_company', label: 'Empresa responsável pelo projeto', type: 'text', required: true },
        { key: 'client_or_distributor', label: 'Cliente, distribuidora ou parceiro operacional', type: 'text', required: true },
        { key: 'release_or_start_date', label: 'Data prevista de início ou lançamento', type: 'date', required: true },
        {
          key: 'release_type', label: 'Tipo de lançamento', type: 'select',
          visibleWhen: [{ key: 'clearance_format', equals: 'music_release_clearance_intake' }],
          options: [
            { label: 'Single', value: 'single' },
            { label: 'EP', value: 'ep' },
            { label: 'Álbum', value: 'album' },
          ],
        },
        {
          key: 'project_synopsis', label: 'Sinopse ou contexto do pedido', type: 'textarea',
          visibleWhen: [{ key: 'clearance_format', equals: 'music_project_track' }],
        },
        {
          key: 'project_synopsis_av', label: 'Sinopse ou contexto do pedido', type: 'textarea',
          visibleWhen: [{ key: 'clearance_format', equals: 'audiovisual_product_sync' }],
        },
        { key: 'has_brand_association', label: 'Existe associação com marca, campanha ou contexto comercial?', type: 'yesno' },
        {
          key: 'brand_context', label: 'Marca ou contexto associado', type: 'text',
          visibleWhen: [{ key: 'has_brand_association', equals: 'yes' }],
        },
        {
          key: 'general_clearance_notes', label: 'Observações gerais de clearance', type: 'textarea', required: true,
          visibleWhen: [{ key: 'clearance_format', equals: 'music_release_clearance_intake' }],
        },
      ],
    },
    {
      id: 'faixas', label: 'Faixas', hint: 'Músicas do pedido',
      title: 'Faixas do pedido',
      description: 'Cadastre cada faixa envolvida no clearance com créditos e titularidade. Se alguma parte (artista, autor, titular) ainda não tiver cadastro, ela recebe automaticamente um convite contextual para completar os dados — sem travar seu envio.',
      visibleWhen: [{ key: 'clearance_format', equals: 'music_release_clearance_intake' }],
      fields: [
        {
          key: 'tracks', label: 'Faixas', type: 'repeater', required: true, minItems: 1,
          itemLabel: 'Faixa',
          fields: TRACK_SUBFIELDS as unknown as import('@/engine/types').FieldDef[],
        },
      ],
    },
    {
      id: 'escopo', label: 'Escopo', hint: 'O que será licenciado',
      title: 'Escopo de clearance',
      description: 'Detalhes do material, titularidade, território e uso pretendido. Partes sem cadastro recebem convite contextual de cadastro após o envio.',
      visibleWhen: [{ key: 'clearance_format', equals: 'music_project_track' }],
      fields: [
        { key: 'music_title', label: 'Título da música', type: 'text', required: true },
        { key: 'artist_name', label: 'Artista principal', type: 'text', required: true },
        { key: 'phonogram_owner', label: 'Titular do fonograma', type: 'text', required: true },
        { key: 'composer_author_info', label: 'Compositores e autores', type: 'text', required: true },
        { key: 'publisher_info', label: 'Editoras ou publishing', type: 'text', required: true },
        { key: 'material_type', label: 'Tipo de material solicitado', type: 'text', required: true },
        { key: 'intended_use', label: 'Uso pretendido', type: 'textarea', required: true },
        { key: 'exclusivity', label: 'Existe pedido de exclusividade?', type: 'yesno', required: true },
        { key: 'territory', label: 'Território', type: 'text', required: true, placeholder: 'Ex.: Brasil, Mundial' },
        { key: 'licensing_period', label: 'Período de licenciamento', type: 'text', required: true, placeholder: 'Ex.: 2 anos a partir do lançamento' },
      ],
    },
    {
      id: 'escopo_av', label: 'Escopo', hint: 'Sync e veiculação',
      title: 'Escopo de clearance',
      description: 'Detalhes da peça audiovisual, cena, duração de sync e canais de veiculação. Partes sem cadastro recebem convite contextual de cadastro após o envio.',
      visibleWhen: [{ key: 'clearance_format', equals: 'audiovisual_product_sync' }],
      fields: [
        { key: 'music_title', label: 'Título da música', type: 'text', required: true },
        { key: 'artist_name', label: 'Artista principal', type: 'text', required: true },
        { key: 'phonogram_owner', label: 'Titular do fonograma', type: 'text', required: true },
        { key: 'audiovisual_type', label: 'Tipo de audiovisual ou produto', type: 'text', required: true, placeholder: 'Ex.: filme publicitário, série, videoclipe' },
        { key: 'director_name', label: 'Direção', type: 'text', required: true },
        { key: 'product_or_campaign_name', label: 'Produto, campanha ou peça', type: 'text', required: true },
        { key: 'scene_description', label: 'Descrição da cena ou da aplicação', type: 'textarea', required: true },
        { key: 'sync_duration', label: 'Duração de sync', type: 'text', required: true, placeholder: 'Ex.: 0:45' },
        { key: 'media_channels', label: 'Canais e meios de veiculação', type: 'textarea', required: true },
        { key: 'territory', label: 'Território', type: 'text', required: true },
        { key: 'licensing_period', label: 'Período de licenciamento', type: 'text', required: true },
      ],
    },
    {
      id: 'assets', label: 'Referências', hint: 'Materiais de apoio',
      title: 'Assets e referências',
      description: 'Anexos e links que ajudam a equipe a avaliar o pedido mais rápido.',
      visibleWhen: [{ key: 'clearance_format', equals: 'music_project_track' }],
      fields: [
        { key: 'supporting_files', label: 'Arquivos de apoio', type: 'file', hint: 'Contratos, splits, demos, roteiros — o que ajudar na análise.' },
        { key: 'reference_links', label: 'Links de referência', type: 'textarea' },
        { key: 'additional_notes', label: 'Observações adicionais', type: 'textarea' },
      ],
    },
    {
      id: 'assets_av', label: 'Referências', hint: 'Materiais de apoio',
      title: 'Assets e referências',
      description: 'Anexos e links que ajudam a equipe a avaliar o pedido mais rápido.',
      visibleWhen: [{ key: 'clearance_format', equals: 'audiovisual_product_sync' }],
      fields: [
        { key: 'supporting_files_av', label: 'Arquivos de apoio', type: 'file' },
        { key: 'reference_links_av', label: 'Links de referência', type: 'textarea' },
        { key: 'additional_notes_av', label: 'Observações adicionais', type: 'textarea' },
      ],
    },
  ],
  sampleEdit: {
    requester_name: 'Rafael Coutinho',
    requester_email: 'rafael@selva.rec.br',
    requester_company: 'Selva Produções',
    requester_role: 'Produtor executivo',
    clearance_format: 'music_release_clearance_intake',
    project_title: 'Maré de Dentro',
    responsible_company: 'Selva Produções',
    client_or_distributor: 'Atabaque',
    release_or_start_date: '2026-09-11',
    release_type: 'single',
    has_brand_association: 'no',
    general_clearance_notes: 'Verificar sample de 8s no refrão — origem sob análise.',
    tracks: [{
      title: 'Maré de Dentro', primary_artists: 'Alaíde Tropical',
      authors: 'Alaíde Costa, Zé Raminho', publishers: 'Editora Maré',
      phonogram_owner: 'Selva Produções', has_isrc: 'no', isrc_code: '',
      notes_for_clearance: 'Sample no segundo refrão.',
    }],
    consentTruth: true,
  },
  successHeading: 'Pedido recebido! 🎉',
  successLead: 'Seu pedido de clearance entrou na fila da equipe Atabaque.',
  successSteps: [
    { title: 'Confirmação imediata', desc: 'E-mail com o resumo do pedido e link para editar.' },
    { title: 'Análise de titularidade', desc: 'A equipe avalia titulares, território, período e materiais de apoio.' },
    { title: 'Resposta com próximos passos', desc: 'Você recebe o parecer do clearance e as condições por e-mail.' },
  ],
  restartLabel: 'Enviar outro pedido',
}
