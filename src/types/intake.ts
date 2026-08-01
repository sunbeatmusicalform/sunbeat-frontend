export interface ArtistReference {
  id: string | null
  name: string
  status: 'registered' | 'unregistered'
  source?: 'people_registry' | 'dados_cadastrais' | 'v2_pessoas'
}

export type PromotionCommitment = '' | 'yes' | 'no' | 'maybe'
export type DateFlexibility = '' | 'fixed' | 'some' | 'open'

export interface Track {
  id: string
  title: string
  mainArtists: string
  mainArtistRefs: ArtistReference[]
  featArtists: string
  composers: string
  performers: string
  hasISRC: 'yes' | 'no' | ''
  isrc: string
  producer: string
  audioFileName: string | null
  isFocus: boolean
  newArtistProfiles: string
  existingProfileLinks: string
  lyrics: string
}

export interface IntakeData {
  responsibleName: string
  responsibleEmail: string
  projectName: string
  releaseType: '' | 'single' | 'ep' | 'album'
  releaseDate: string
  genre: string
  videoLink: string
  videoDate: string
  coverFileName: string | null
  additionalFiles: string | null
  tracks: Track[]
  marketingNumbers: string
  focusDescription: string
  goals: string[]
  hasMarketingBudget: boolean | null
  marketingBudget: string
  dateFlexibility: DateFlexibility
  hasSpecialGuests: boolean | null
  guestsBio: string
  guestsPromote: PromotionCommitment
  promoParticipants: string
  influencers: string
  notes: string
  consentTruth: boolean
}

export const GOAL_OPTIONS = [
  'Crescimento de ouvintes nas plataformas',
  'Playlisting editorial',
  'Alcance em redes sociais',
  'Imprensa / mídia especializada',
  'Sinc (TV, cinema, publicidade)',
  'Shows e booking',
] as const

export const GENRES = [
  'MPB', 'Pop', 'Samba', 'Forró', 'Sertanejo', 'Rock', 'Hip Hop / Rap',
  'Eletrônica', 'Funk', 'Gospel', 'Jazz', 'Clássica / Erudita', 'Reggae',
  'R&B / Soul', 'Axé', 'Bossa Nova', 'Experimental', 'Outro',
] as const

export function emptyTrack(order: number): Track {
  return {
    id: `${order}-${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    mainArtists: '',
    mainArtistRefs: [],
    featArtists: '',
    composers: '',
    performers: '',
    hasISRC: '',
    isrc: '',
    producer: '',
    audioFileName: null,
    isFocus: false,
    newArtistProfiles: '',
    existingProfileLinks: '',
    lyrics: '',
  }
}

export function emptyIntake(): IntakeData {
  return {
    responsibleName: '',
    responsibleEmail: '',
    projectName: '',
    releaseType: '',
    releaseDate: '',
    genre: '',
    videoLink: '',
    videoDate: '',
    coverFileName: null,
    additionalFiles: null,
    tracks: [emptyTrack(1)],
    marketingNumbers: '',
    focusDescription: '',
    goals: [],
    hasMarketingBudget: null,
    marketingBudget: '',
    dateFlexibility: '',
    hasSpecialGuests: null,
    guestsBio: '',
    guestsPromote: '',
    promoParticipants: '',
    influencers: '',
    notes: '',
    consentTruth: false,
  }
}
