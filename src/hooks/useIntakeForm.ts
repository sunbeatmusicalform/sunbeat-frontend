import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyIntake, emptyTrack, type IntakeData, type Track } from '@/types/intake'

export type StepId = 'welcome' | 'identificacao' | 'projeto' | 'faixas' | 'marketing' | 'revisao' | 'sucesso'

export const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'identificacao', label: 'Identificação', hint: 'Dados do responsável e do projeto' },
  { id: 'projeto', label: 'Projeto', hint: 'Informações principais do lançamento' },
  { id: 'faixas', label: 'Faixas', hint: 'Cadastre as faixas do projeto' },
  { id: 'marketing', label: 'Marketing', hint: 'Detalhes complementares do lançamento' },
  { id: 'revisao', label: 'Revisão', hint: 'Revise e envie' },
]

export type Mode = 'new' | 'draft' | 'edit'

const DRAFT_KEY = 'sunbeat.intake.atabaque.draft'

export function useIntakeForm() {
  const [step, setStep] = useState<StepId>('welcome')
  const [data, setDataState] = useState<IntakeData>(emptyIntake)
  const [mode, setMode] = useState<Mode>('new')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [touchedSubmit, setTouchedSubmit] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // autosave (draft mode)
  useEffect(() => {
    if (step === 'welcome' || step === 'sucesso') return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step, savedAt: new Date().toISOString() }))
      setSavedAt(new Date())
    }, 800)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [data, step])

  const setData = useCallback(<K extends keyof IntakeData>(key: K, value: IntakeData[K]) => {
    setDataState((d) => ({ ...d, [key]: value }))
  }, [])

  const setTrack = useCallback((id: string, patch: Partial<Track>) => {
    setDataState((d) => ({ ...d, tracks: d.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }, [])

  const addTrack = useCallback(() => {
    setDataState((d) => ({ ...d, tracks: [...d.tracks, emptyTrack(d.tracks.length + 1)] }))
  }, [])

  const removeTrack = useCallback((id: string) => {
    setDataState((d) => ({ ...d, tracks: d.tracks.filter((t) => t.id !== id) }))
  }, [])

  const setFocusTrack = useCallback((id: string) => {
    setDataState((d) => ({ ...d, tracks: d.tracks.map((t) => ({ ...t, isFocus: t.id === id })) }))
  }, [])

  const resumeDraft = useCallback(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      setDataState({ ...emptyIntake(), ...parsed.data })
      setStep(parsed.step === 'welcome' || parsed.step === 'sucesso' ? 'identificacao' : parsed.step)
      setMode('draft')
      setSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : new Date())
      return true
    } catch { return false }
  }, [])

  const hasDraft = useCallback(() => !!localStorage.getItem(DRAFT_KEY), [])

  // edit mode: simulates loading an existing submission (from Airtable) by ID
  const loadForEdit = useCallback(() => {
    const sample: IntakeData = {
      ...emptyIntake(),
      responsibleName: 'Marina Duarte',
      responsibleEmail: 'marina@selva.rec.br',
      projectName: 'Ciranda Elétrica',
      releaseType: 'single',
      releaseDate: '2026-08-21',
      genre: 'MPB',
      tracks: [{
        ...emptyTrack(1),
        title: 'Ciranda Elétrica', mainArtists: 'Alaíde Tropical', composers: 'Alaíde Costa, Zé Raminho',
        performers: 'Alaíde Tropical', hasISRC: 'no', producer: 'Estúdio Pedra Selva', isFocus: true,
      }],
      focusDescription: 'Faixa de trabalho para rádios e playlists de MPB nova.',
      goals: ['Playlisting editorial', 'Imprensa / mídia especializada'],
      consentTruth: true,
    }
    setDataState(sample)
    setMode('edit')
    setStep('identificacao')
  }, [])

  const submit = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setStep('sucesso')
  }, [])

  return {
    step, setStep, data, setData, setTrack, addTrack, removeTrack, setFocusTrack,
    mode, savedAt, resumeDraft, hasDraft, loadForEdit, submit,
    touchedSubmit, setTouchedSubmit,
  }
}

/* ---------------- validation ---------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i

export function fieldErrors(step: StepId, d: IntakeData): Record<string, string> {
  const e: Record<string, string> = {}
  if (step === 'identificacao') {
    if (!d.responsibleName.trim()) e.responsibleName = 'Como devemos te chamar?'
    if (!EMAIL_RE.test(d.responsibleEmail)) e.responsibleEmail = 'Use um e-mail válido — o resumo do envio chega nele.'
  }
  if (step === 'projeto') {
    if (!d.projectName.trim()) e.projectName = 'Dê um nome ao projeto (pode mudar depois).'
    if (!d.releaseType) e.releaseType = 'Escolha o formato do lançamento.'
    if (!d.releaseDate) e.releaseDate = 'Sem data não conseguimos montar o cronograma.'
    else if (d.releaseDate < new Date().toISOString().slice(0, 10)) e.releaseDate = 'A data precisa ser futura.'
    if (!d.genre) e.genre = 'O gênero orienta distribuição e playlists.'
    if (d.videoLink && !/^https?:\/\/.+/.test(d.videoLink)) e.videoLink = 'Cole o link completo, começando com https://'
  }
  if (step === 'faixas') {
    d.tracks.forEach((t, i) => {
      const p = `t${i}.`
      if (!t.title.trim()) e[p + 'title'] = `Faixa ${i + 1}: informe o título.`
      if (!t.mainArtists.trim()) e[p + 'mainArtists'] = 'Quem são os artistas principais?'
      if (!t.composers.trim()) e[p + 'composers'] = 'Créditos de composição são obrigatórios para o ISRC.'
      if (!t.hasISRC) e[p + 'hasISRC'] = 'Selecione uma opção.'
      if (t.hasISRC === 'yes' && !ISRC_RE.test(t.isrc.trim()))
        e[p + 'isrc'] = 'Formato esperado: 2 letras + 3 caracteres + 7 números (ex.: BRABC2600001).'
      if (!t.producer.trim()) e[p + 'producer'] = 'O produtor fonográfico é exigido pelas plataformas.'
      if (!t.audioFileName) e[p + 'audio'] = 'Anexe o áudio (WAV de preferência).'
    })
    if (!d.tracks.some((t) => t.isFocus)) e.focusTrack = 'Marque qual faixa é o foco do lançamento.'
  }
  if (step === 'marketing') {
    if (!d.focusDescription.trim()) e.focusDescription = 'Conte em uma frase qual é o foco deste lançamento.'
    if (d.goals.length === 0) e.goals = 'Escolha pelo menos uma meta.'
    if (d.hasSpecialGuests === null) e.hasSpecialGuests = 'Selecione sim ou não.'
    if (d.hasSpecialGuests && !d.guestsBio.trim()) e.guestsBio = 'Inclua uma mini bio das participações.'
  }
  if (step === 'revisao') {
    if (!d.consentTruth) e.consentTruth = 'É preciso confirmar a declaração antes de enviar.'
  }
  return e
}

export function stepValid(step: StepId, d: IntakeData) {
  return Object.keys(fieldErrors(step, d)).length === 0
}

/* ---------------- file analysis ---------------- */

export interface AudioReport { duration: string; sampleRate: number; bitDepth: number; channels: number; ok: boolean; notes: string[] }
export interface CoverReport { width: number; height: number; square: boolean; ok: boolean; notes: string[] }

export async function analyzeWav(file: File): Promise<AudioReport> {
  const buf = await file.slice(0, 64 * 1024).arrayBuffer()
  const dv = new DataView(buf)
  const notes: string[] = []
  const riff = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) === 'RIFF'
  if (!riff) {
    return { duration: '—', sampleRate: 0, bitDepth: 0, channels: 0, ok: false, notes: ['Este arquivo não é um WAV válido. Envie o master em WAV.'] }
  }
  const channels = dv.getUint16(22, true)
  const sampleRate = dv.getUint32(24, true)
  const byteRate = dv.getUint32(28, true)
  const bitDepth = dv.getUint16(34, true)
  const seconds = byteRate ? file.size / byteRate : 0
  const mm = Math.floor(seconds / 60), ss = Math.round(seconds % 60)
  if (sampleRate < 44100) notes.push('Sample rate abaixo de 44.1 kHz — as plataformas exigem 44.1 kHz ou mais.')
  if (bitDepth < 16) notes.push('Profundidade de bits abaixo de 16 bits.')
  if (sampleRate >= 44100 && bitDepth >= 16) notes.push('Formato compatível com distribuição (CD quality ou superior). ✓')
  return { duration: `${mm}:${String(ss).padStart(2, '0')}`, sampleRate, bitDepth, channels, ok: sampleRate >= 44100 && bitDepth >= 16, notes }
}

export function analyzeCover(file: File): Promise<CoverReport> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const notes: string[] = []
      const square = img.width === img.height
      if (!square) notes.push('A capa precisa ser quadrada (ex.: 3000 × 3000 px).')
      if (img.width < 1400) notes.push('Resolução abaixo do mínimo das plataformas (1400 px).')
      if (square && img.width >= 3000) notes.push('Resolução ideal para todas as plataformas. ✓')
      else if (square && img.width >= 1400) notes.push('Dentro do mínimo — recomendamos 3000 × 3000 px.')
      URL.revokeObjectURL(img.src)
      resolve({ width: img.width, height: img.height, square, ok: square && img.width >= 1400, notes })
    }
    img.onerror = () => reject(new Error('Não conseguimos ler esta imagem.'))
    img.src = URL.createObjectURL(file)
  })
}
