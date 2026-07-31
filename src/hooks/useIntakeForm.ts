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
  const [draftToken, setDraftToken] = useState(() => crypto.randomUUID())
  const [coverFile, setCoverFileState] = useState<File | null>(null)
  const [audioFiles, setAudioFiles] = useState<Record<string, File>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // autosave (draft mode)
  useEffect(() => {
    if (step === 'welcome' || step === 'sucesso') return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step, draftToken, savedAt: new Date().toISOString() }))
      setSavedAt(new Date())
    }, 800)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [data, step, draftToken])

  const setCoverFile = useCallback((file: File | null) => {
    setCoverFileState(file)
    setDataState((d) => ({ ...d, coverFileName: file?.name ?? null }))
  }, [])

  const setAudioFile = useCallback((trackId: string, file: File | null) => {
    setAudioFiles((current) => {
      const next = { ...current }
      if (file) next[trackId] = file
      else delete next[trackId]
      return next
    })
    setDataState((d) => ({
      ...d,
      tracks: d.tracks.map((track) => track.id === trackId
        ? { ...track, audioFileName: file?.name ?? null }
        : track),
    }))
  }, [])

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
      const restored = { ...emptyIntake(), ...parsed.data }
      const legacyGuestsPromote = restored.guestsPromote as unknown
      restored.guestsPromote = legacyGuestsPromote === true
        ? 'yes'
        : legacyGuestsPromote === false
          ? 'no'
          : legacyGuestsPromote === 'yes' || legacyGuestsPromote === 'no' || legacyGuestsPromote === 'maybe'
            ? legacyGuestsPromote
            : ''
      restored.coverFileName = null
      restored.tracks = restored.tracks.map((track: Track) => ({
        ...track,
        mainArtistRefs: track.mainArtistRefs ?? [],
        audioFileName: null,
      }))
      setDataState(restored)
      setCoverFileState(null)
      setAudioFiles({})
      if (typeof parsed.draftToken === 'string') setDraftToken(parsed.draftToken)
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
        audioFileName: 'ciranda-eletrica-master.wav',
      }],
      focusDescription: 'Faixa de trabalho para rádios e playlists de MPB nova.',
      goals: ['Playlisting editorial', 'Imprensa / mídia especializada'],
      marketingNumbers: 'Turnê regional concluída e crescimento orgânico nas plataformas.',
      hasMarketingBudget: true,
      marketingBudget: 'R$ 5.000',
      dateFlexibility: 'some',
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
    touchedSubmit, setTouchedSubmit, draftToken, coverFile, audioFiles,
    setCoverFile, setAudioFile,
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
    if (d.additionalFiles && !/^https?:\/\/.+/.test(d.additionalFiles)) e.additionalFiles = 'Cole um link completo para o kit visual.'
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

export interface StandardCheck { label: string; status: 'ok' | 'warning' | 'no'; detail: string }
export interface AudioReport { format: string; duration: string; sampleRate: number; bitDepth: number; channels: number; ok: boolean; notes: string[]; standards: StandardCheck[] }
export interface CoverReport { format: string; sizeMb: number; width: number; height: number; square: boolean; ok: boolean; notes: string[]; standards: StandardCheck[] }

export async function analyzeWav(file: File): Promise<AudioReport> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extension === 'flac') {
    return {
      format: 'FLAC', duration: '—', sampleRate: 0, bitDepth: 0, channels: 0, ok: true,
      notes: ['FLAC é aceito no estéreo The Orchard. Sample rate, bit depth e canais serão confirmados no preflight técnico.'],
      standards: [
        { label: 'The Orchard · estéreo', status: 'warning', detail: 'Formato aceito; metadados técnicos pendentes.' },
        { label: 'Dolby Atmos · Apple Lossless', status: 'no', detail: 'O padrão informado exige WAV 24-bit / 48 kHz.' },
      ],
    }
  }
  const buf = await file.slice(0, 64 * 1024).arrayBuffer()
  const dv = new DataView(buf)
  const notes: string[] = []
  const riff = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) === 'RIFF'
  if (!riff) {
    return { format: extension.toUpperCase() || 'Arquivo', duration: '—', sampleRate: 0, bitDepth: 0, channels: 0, ok: false, notes: ['O arquivo não é WAV nem FLAC válido.'], standards: [] }
  }
  const channels = dv.getUint16(22, true)
  const sampleRate = dv.getUint32(24, true)
  const byteRate = dv.getUint32(28, true)
  const bitDepth = dv.getUint16(34, true)
  const seconds = byteRate ? file.size / byteRate : 0
  const mm = Math.floor(seconds / 60), ss = Math.round(seconds % 60)
  const orchardRates = bitDepth === 16 ? [44100, 48000] : bitDepth === 24 ? [44100, 48000, 88200, 96000, 176400, 192000] : []
  const orchardOk = channels === 2 && orchardRates.includes(sampleRate)
  const dolbyOk = bitDepth === 24 && sampleRate === 48000
  if (channels !== 2) notes.push('O master estéreo The Orchard precisa ter exatamente 2 canais.')
  if (!orchardRates.includes(sampleRate)) notes.push(`${bitDepth}-bit / ${sampleRate} Hz não está na matriz estéreo informada pela Atabaque.`)
  if (orchardOk) notes.push('Master compatível com a matriz estéreo The Orchard. ✓')
  return {
    format: 'WAV', duration: `${mm}:${String(ss).padStart(2, '0')}`, sampleRate, bitDepth, channels, ok: orchardOk, notes,
    standards: [
      { label: 'The Orchard · estéreo', status: orchardOk ? 'ok' : 'no', detail: orchardOk ? 'Canais, bit depth e sample rate compatíveis.' : 'Revise canais, bit depth ou sample rate.' },
      { label: 'Dolby Atmos · Apple Lossless', status: dolbyOk ? 'ok' : 'no', detail: dolbyOk ? 'WAV 24-bit / 48 kHz.' : 'Exige WAV 24-bit / 48 kHz.' },
    ],
  }
}

function readTiffDimensions(buffer: ArrayBuffer): { width: number; height: number } | null {
  const view = new DataView(buffer)
  if (view.byteLength < 16) return null
  const marker = String.fromCharCode(view.getUint8(0), view.getUint8(1))
  const little = marker === 'II'
  if (!little && marker !== 'MM') return null
  const ifdOffset = view.getUint32(4, little)
  if (ifdOffset + 2 > view.byteLength) return null
  const count = view.getUint16(ifdOffset, little)
  let width = 0, height = 0
  for (let index = 0; index < count; index += 1) {
    const offset = ifdOffset + 2 + index * 12
    if (offset + 12 > view.byteLength) break
    const tag = view.getUint16(offset, little)
    const type = view.getUint16(offset + 2, little)
    const value = type === 3 ? view.getUint16(offset + 8, little) : view.getUint32(offset + 8, little)
    if (tag === 256) width = value
    if (tag === 257) height = value
  }
  return width && height ? { width, height } : null
}

function buildCoverReport(file: File, width: number, height: number): CoverReport {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const format = extension === 'tif' || extension === 'tiff' ? 'TIFF' : extension.toUpperCase()
  const sizeMb = file.size / (1024 * 1024)
  const square = width === height && width > 0
  const notes: string[] = []
  if (!square) notes.push('A capa precisa ser quadrada.')
  if (width < 1500) notes.push('Abaixo do mínimo de 1500 × 1500 px usado no padrão mais permissivo.')
  if (square && width >= 3000) notes.push('Dimensão recomendada para a maioria dos destinos. ✓')
  const jpg = ['jpg', 'jpeg'].includes(extension)
  const png = extension === 'png'
  const tiff = ['tif', 'tiff'].includes(extension)
  const standards: StandardCheck[] = [
    { label: 'Urban', status: tiff && width === 3000 && height === 3000 ? 'warning' : 'no', detail: tiff && width === 3000 ? 'Dimensão/formato corretos; confirmar LZW e resolução >150 dpi.' : 'Exige TIFF LZW, 3000 × 3000.' },
    { label: 'Universal', status: tiff && square && width >= 1500 && width <= 3000 && sizeMb <= 100 ? 'warning' : 'no', detail: tiff && square && width >= 1500 && width <= 3000 ? 'Estrutura compatível; confirmar RGB 8-bit, 300–600 ppi, sem alpha/perfil e LZW.' : 'Exige TIFF, 1500–3000 px e até 100 MB.' },
    { label: 'Som Livre', status: jpg && square && width >= 3000 && width <= 6000 ? 'ok' : 'no', detail: 'JPG quadrado entre 3000 e 6000 px.' },
    { label: 'ONErpm', status: (jpg || png) && square && width >= 3000 && sizeMb <= 35 ? 'warning' : 'no', detail: (jpg || png) && square && width >= 3000 && sizeMb <= 35 ? 'Dimensão/tamanho corretos; confirmar RGB e 72 dpi.' : 'JPG/PNG, mínimo 3000 px e até 35 MB.' },
    { label: 'Ingrooves', status: (jpg || png || tiff) && square && width >= 1500 ? 'warning' : 'no', detail: (jpg || png || tiff) && square && width >= 1500 ? 'Dimensão/formato compatíveis; confirmar RGB.' : 'JPG/PNG/TIFF, mínimo 1500 px.' },
  ]
  return { format, sizeMb, width, height, square, ok: square && width >= 1500 && standards.some((item) => item.status !== 'no'), notes, standards }
}

export async function analyzeCover(file: File): Promise<CoverReport> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extension === 'tif' || extension === 'tiff') {
    const dimensions = readTiffDimensions(await file.slice(0, 256 * 1024).arrayBuffer())
    if (!dimensions) return buildCoverReport(file, 0, 0)
    return buildCoverReport(file, dimensions.width, dimensions.height)
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(buildCoverReport(file, img.width, img.height))
    }
    img.onerror = () => reject(new Error('Não conseguimos ler esta imagem.'))
    img.src = URL.createObjectURL(file)
  })
}
