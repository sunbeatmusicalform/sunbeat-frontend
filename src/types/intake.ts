export interface Track {
  id: string
  title: string
  mainArtists: string
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
  focusDescription: string
  goals: string[]
  hasSpecialGuests: boolean | null
  guestsBio: string
  guestsPromote: boolean | null
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

export function emptyTrack(_order: number): Track {
  return {
    id: Math.random().toString(36).slice(2, 9),
    title: '',
    mainArtists: '',
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
    focusDescription: '',
    goals: [],
    hasSpecialGuests: null,
    guestsBio: '',
    guestsPromote: null,
    promoParticipants: '',
    influencers: '',
    notes: '',
    consentTruth: false,
  }
}
