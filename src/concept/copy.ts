export type ConceptLocale = 'en' | 'pt-BR'

export const CONCEPT_COPY = {
  en: {
    localeLabel: 'English',
    eyebrow: 'A journey from chaos to clarity',
    brandLine: 'Intelligent infrastructure for creative markets',
    skip: 'Skip the journey',
    scroll: 'Scroll to rise',
    progress: 'Journey progress',
    chapters: [
      {
        number: '01',
        kicker: 'The invisible ocean',
        title: 'Every operation has a world beneath the surface.',
        body: 'Files, people, rights, deadlines and decisions drift in different directions — close enough to matter, too scattered to move together.',
      },
      {
        number: '02',
        kicker: 'People behind the data',
        title: 'Behind every file, there is a person.',
        body: 'Behind every release, an operation trying to create, connect and move forward without losing what makes the work human.',
      },
      {
        number: '03',
        kicker: 'The first ray',
        title: 'Clarity begins with one connection.',
        body: 'Sunbeat finds the relationships hidden inside the noise. Information begins to align. The operation starts to reveal itself.',
      },
      {
        number: '04',
        kicker: 'Toward the surface',
        title: 'One flow. Every moving part in sync.',
        body: 'Intake, files, rights, people and integrations rise together — structured by MotorSchema and always reviewable by your team.',
      },
      {
        number: '05',
        kicker: 'Breathe again',
        title: 'Your operation, finally in view.',
        body: 'Cleaner submissions. Audited assets. Connected data. Fewer operational blind spots between the idea and the release.',
      },
      {
        number: '06',
        kicker: 'The sun',
        title: 'Shine brighter. Work smarter.',
        body: 'Built for the people behind the music.',
      },
    ],
    streams: ['Intake', 'Files', 'Rights', 'People', 'Integrations'],
    primaryCta: 'Start free',
    secondaryCta: 'See the product',
    endKicker: 'From narrative to operation',
    endTitle: 'The surface is only the beginning.',
    endBody: 'Sunbeat turns the clarity you just experienced into intelligent forms, file audits and connected creative operations.',
  },
  'pt-BR': {
    localeLabel: 'Português',
    eyebrow: 'Uma jornada do caos à clareza',
    brandLine: 'Infraestrutura inteligente para mercados criativos',
    skip: 'Pular a jornada',
    scroll: 'Role para subir',
    progress: 'Progresso da jornada',
    chapters: [
      {
        number: '01',
        kicker: 'O oceano invisível',
        title: 'Toda operação possui um mundo abaixo da superfície.',
        body: 'Arquivos, pessoas, direitos, prazos e decisões seguem em direções diferentes — próximos o bastante para importar, dispersos demais para avançar juntos.',
      },
      {
        number: '02',
        kicker: 'As pessoas por trás dos dados',
        title: 'Por trás de cada arquivo, existe uma pessoa.',
        body: 'Por trás de cada lançamento, existe uma operação tentando criar, conectar e seguir em frente sem perder o que torna o trabalho humano.',
      },
      {
        number: '03',
        kicker: 'O primeiro raio',
        title: 'A clareza começa com uma conexão.',
        body: 'A Sunbeat encontra as relações escondidas no ruído. As informações começam a se alinhar. A operação passa a se revelar.',
      },
      {
        number: '04',
        kicker: 'Em direção à superfície',
        title: 'Um fluxo. Todas as partes em sintonia.',
        body: 'Intake, arquivos, direitos, pessoas e integrações sobem juntos — estruturados pelo MotorSchema e sempre revisáveis pela sua equipe.',
      },
      {
        number: '05',
        kicker: 'Respirar novamente',
        title: 'Sua operação, finalmente visível.',
        body: 'Submissões mais limpas. Assets auditados. Dados conectados. Menos pontos cegos entre a ideia e o lançamento.',
      },
      {
        number: '06',
        kicker: 'O sol',
        title: 'Brilhe mais. Trabalhe com inteligência.',
        body: 'Feita para as pessoas por trás da música.',
      },
    ],
    streams: ['Intake', 'Arquivos', 'Direitos', 'Pessoas', 'Integrações'],
    primaryCta: 'Começar grátis',
    secondaryCta: 'Conheça o produto',
    endKicker: 'Da narrativa para a operação',
    endTitle: 'A superfície é apenas o começo.',
    endBody: 'A Sunbeat transforma a clareza que você acabou de sentir em formulários inteligentes, auditoria de arquivos e operações criativas conectadas.',
  },
} as const

export function resolveConceptLocale(): ConceptLocale {
  const queryLocale = new URLSearchParams(window.location.search).get('lang')
  if (queryLocale === 'pt' || queryLocale === 'pt-BR') return 'pt-BR'
  if (queryLocale === 'en') return 'en'
  return window.location.hostname.endsWith('.com.br') ? 'pt-BR' : 'en'
}
