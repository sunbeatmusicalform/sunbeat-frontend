export const LGPD_CONSENT_VERSION = 'lgpd-v1-2026-07'

export const CONFIDENTIALITY_NOTICE =
  'Materiais enviados neste formulário podem conter informações confidenciais de projeto musical. ' +
  'Compartilhe apenas arquivos necessários ao fluxo e evite encaminhar links de rascunho, edição ou ' +
  'download para pessoas não envolvidas.'

export function consentLabel(clientName: string) {
  return (
    `Ao enviar este formulário, confirmo que as informações fornecidas são verdadeiras e autorizo ` +
    `seu uso pela ${clientName} e pela Sunbeat para fins de análise, cadastro, operação de lançamento, ` +
    `clearance, contratos, comunicação e organização dos materiais relacionados ao projeto. ` +
    `Os dados serão tratados conforme a política de privacidade aplicável e compartilhados apenas ` +
    `com pessoas e sistemas necessários para a execução do fluxo.`
  )
}

export const CONSENT_ERROR = 'É preciso confirmar a declaração antes de enviar.'
