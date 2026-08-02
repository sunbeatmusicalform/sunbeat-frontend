import { emptyIntake, emptyTrack, type ArtistReference, type DateFlexibility, type IntakeData, type PromotionCommitment, type TimedLyricLine } from '@/types/intake'

export interface UploadedFileRef {
  file_name: string
  storage_bucket: string
  storage_path: string
  public_url: string
  download_url: string
  mime_type: string
  size_bytes: number
}

export interface LoadedIntakeDraft {
  data: IntakeData
  currentStep: string
  draftToken: string
  updatedAt: string | null
  draftLinkEmailSent: boolean
}

export interface DraftLinkEmailResult {
  already_sent?: boolean
  disabled?: boolean
  draft_link_email_sent?: boolean
  message?: string
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeCreditNames(value: string): string | null {
  const normalized = value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean)
    .join(', ')
  return normalized || null
}

function yesNoBoolean(value: unknown): boolean | null {
  return value === 'yes' ? true : value === 'no' ? false : null
}

function dateFlexibilityValue(value: unknown): DateFlexibility {
  if (value === 'Data fixa' || value === 'fixed') return 'fixed'
  if (value === 'Alguma flexibilidade' || value === 'some') return 'some'
  if (value === 'Data aberta para planejamento' || value === 'open') return 'open'
  return ''
}

function promotionCommitmentValue(value: unknown, notes: string): PromotionCommitment {
  if (value === 'yes' || value === 'no') return value
  return notes.includes('Divulgação das participações: a confirmar.') ? 'maybe' : ''
}

function artistReferences(value: unknown): ArtistReference[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const candidate = record(item)
    const name = textValue(candidate.name).trim()
    if (!name) return []
    const status = candidate.status === 'registered' ? 'registered' : 'unregistered'
    const source = candidate.source === 'people_registry' || candidate.source === 'dados_cadastrais' || candidate.source === 'v2_pessoas'
      ? candidate.source
      : undefined
    return [{ id: typeof candidate.id === 'string' ? candidate.id : null, name, status, source }]
  })
}

function timedLyrics(value: unknown): TimedLyricLine[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const candidate = record(item)
    const id = textValue(candidate.id)
    const text = textValue(candidate.text)
    if (!id || !text) return []
    const status = candidate.status === 'timed' || candidate.status === 'section' ? candidate.status : 'unmatched'
    return [{
      id,
      text,
      start_ms: typeof candidate.start_ms === 'number' ? candidate.start_ms : null,
      end_ms: typeof candidate.end_ms === 'number' ? candidate.end_ms : null,
      confidence: typeof candidate.confidence === 'number' ? candidate.confidence : 0,
      status,
      needs_review: candidate.needs_review !== false,
    }]
  })
}

function intakeDataFromStoredValues(value: unknown): IntakeData {
  const values = record(value)
  const identification = record(values.identification)
  const project = record(values.project)
  const marketing = record(values.marketing)
  const meta = record(values.meta)
  const consent = record(meta.consent)
  const notesWithStatus = textValue(marketing.general_notes)
  const storedTracks = Array.isArray(values.tracks) ? values.tracks : []
  const releaseType = identification.release_type
  const data = emptyIntake()

  return {
    ...data,
    responsibleName: textValue(identification.submitter_name),
    responsibleEmail: textValue(identification.submitter_email),
    projectName: textValue(identification.project_title),
    releaseType: releaseType === 'single' || releaseType === 'ep' || releaseType === 'album' ? releaseType : '',
    releaseDate: textValue(project.release_date),
    genre: textValue(project.genre),
    videoLink: textValue(project.video_link),
    videoDate: textValue(project.video_release_date),
    additionalFiles: textValue(project.promo_assets_link) || null,
    tracks: storedTracks.length ? storedTracks.map((item, index) => {
      const stored = record(item)
      const fallback = emptyTrack(index + 1)
      const hasISRC = stored.has_isrc
      return {
        ...fallback,
        id: textValue(stored.local_id) || fallback.id,
        title: textValue(stored.title),
        mainArtists: textValue(stored.primary_artists),
        mainArtistRefs: artistReferences(stored.primary_artist_refs),
        featArtists: textValue(stored.featured_artists),
        composers: textValue(stored.authors),
        performers: textValue(stored.interpreters),
        hasISRC: hasISRC === 'yes' || hasISRC === 'no' ? hasISRC : '',
        isrc: textValue(stored.isrc_code),
        producer: textValue(stored.phonographic_producer),
        isFocus: stored.is_focus_track === true,
        newArtistProfiles: textValue(stored.artist_profile_names_to_create),
        existingProfileLinks: textValue(stored.existing_profile_links),
        lyrics: textValue(stored.lyrics),
        timedLyrics: timedLyrics(stored.timed_lyrics),
        audioFileName: null,
      }
    }) : data.tracks,
    marketingNumbers: textValue(marketing.marketing_numbers),
    focusDescription: textValue(marketing.marketing_focus),
    goals: textValue(marketing.marketing_objectives).split(',').map((goal) => goal.trim()).filter(Boolean),
    hasMarketingBudget: yesNoBoolean(marketing.has_marketing_budget),
    marketingBudget: textValue(marketing.marketing_budget),
    dateFlexibility: dateFlexibilityValue(marketing.date_flexibility),
    hasSpecialGuests: yesNoBoolean(marketing.has_special_guests),
    guestsBio: textValue(marketing.special_guests_bio),
    guestsPromote: promotionCommitmentValue(marketing.feat_will_promote, notesWithStatus),
    promoParticipants: textValue(marketing.promotion_participants),
    influencers: textValue(marketing.influencers_brands_partners),
    notes: notesWithStatus.replace(/\n?Divulgação das participações: a confirmar\./g, '').trim(),
    consentTruth: consent.truth_confirmed === true,
  }
}

async function apiError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = await response.json() as { detail?: unknown; message?: unknown }
    const message = typeof data.detail === 'string' ? data.detail : data.message
    if (typeof message === 'string' && message.trim()) return new Error(message)
  } catch { /* response was not JSON */ }
  return new Error(fallback)
}

export async function uploadIntakeFile(args: {
  file: File
  kind: 'cover' | 'audio' | 'asset'
  workspaceSlug: string
  draftToken: string
  trackLocalId?: string
}): Promise<UploadedFileRef> {
  const signResponse = await fetch('/uploads/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: args.kind,
      file_name: args.file.name,
      mime_type: args.file.type,
      file_size: args.file.size,
      workspace_slug: args.workspaceSlug,
      draft_token: args.draftToken,
      track_local_id: args.trackLocalId ?? '',
    }),
  })
  if (!signResponse.ok) throw await apiError(signResponse, `Falha ao preparar ${args.file.name}.`)
  const signed = await signResponse.json() as { signed_upload_url: string; file: UploadedFileRef }
  const body = new FormData()
  body.append('file', args.file)
  const uploadResponse = await fetch(signed.signed_upload_url, { method: 'PUT', body })
  if (!uploadResponse.ok) throw new Error(`Falha ao enviar ${args.file.name}.`)
  return signed.file
}

export function buildIntakePayload(args: {
  data: IntakeData
  workspaceSlug: string
  draftToken: string
  coverFile?: UploadedFileRef | null
  audioFiles?: Record<string, UploadedFileRef>
}) {
  const { data, workspaceSlug, draftToken, coverFile = null, audioFiles = {} } = args
  const focusTrack = data.tracks.find((track) => track.isFocus) ?? data.tracks[0]
  return {
    draft_token: draftToken,
    workspace_slug: workspaceSlug,
    workflow_type: 'release_intake',
    identification: {
      submitter_name: data.responsibleName,
      submitter_email: data.responsibleEmail,
      project_title: data.projectName,
      release_type: data.releaseType,
    },
    project: {
      release_date: data.releaseDate,
      genre: data.genre || null,
      cover_file: coverFile,
      promo_assets_link: data.additionalFiles || null,
      has_video_asset: data.videoLink ? 'yes' : 'no',
      video_link: data.videoLink || null,
      video_release_date: data.videoDate || null,
    },
    tracks: data.tracks.map((track, index) => ({
      local_id: track.id,
      order_number: index + 1,
      title: track.title,
      is_focus_track: track.id === focusTrack?.id,
      primary_artists: track.mainArtists,
      primary_artist_refs: track.mainArtistRefs?.length ? track.mainArtistRefs : track.mainArtists.split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({ id: null, name, status: 'unregistered' })),
      featured_artists: normalizeCreditNames(track.featArtists),
      interpreters: normalizeCreditNames(track.performers),
      authors: normalizeCreditNames(track.composers) ?? '',
      phonographic_producer: track.producer,
      artist_profile_names_to_create: track.newArtistProfiles || null,
      existing_profile_links: track.existingProfileLinks || null,
      has_isrc: track.hasISRC || null,
      isrc_code: track.isrc || null,
      lyrics: track.lyrics || null,
      timed_lyrics: track.timedLyrics.length ? track.timedLyrics : null,
      audio_file: audioFiles[track.id] ?? null,
    })),
    marketing: {
      marketing_numbers: data.marketingNumbers || null,
      marketing_focus: data.focusDescription || null,
      marketing_objectives: data.goals.join(', ') || null,
      has_marketing_budget: data.hasMarketingBudget === null ? null : data.hasMarketingBudget ? 'yes' : 'no',
      marketing_budget: data.hasMarketingBudget ? data.marketingBudget || null : null,
      focus_track_name: focusTrack?.title || null,
      date_flexibility: data.dateFlexibility === 'fixed'
        ? 'Data fixa'
        : data.dateFlexibility === 'some'
          ? 'Alguma flexibilidade'
          : data.dateFlexibility === 'open'
            ? 'Data aberta para planejamento'
            : null,
      has_special_guests: data.hasSpecialGuests ? 'yes' : 'no',
      special_guests_bio: data.hasSpecialGuests ? data.guestsBio || null : null,
      feat_will_promote: data.hasSpecialGuests && data.guestsPromote !== 'maybe' ? data.guestsPromote || null : null,
      promotion_participants: data.hasSpecialGuests ? data.promoParticipants || null : null,
      influencers_brands_partners: data.influencers || null,
      general_notes: [data.notes, data.hasSpecialGuests && data.guestsPromote === 'maybe' ? 'Divulgação das participações: a confirmar.' : ''].filter(Boolean).join('\n') || null,
    },
    meta: {
      form_version: 'vite_v1',
      source: `sunbeat:${workspaceSlug}:release_intake:vite_v1`,
      submitted_at: new Date().toISOString(),
      consent: { truth_confirmed: data.consentTruth },
    },
  }
}

export async function saveIntakeDraft(args: {
  data: IntakeData
  workspaceSlug: string
  draftToken: string
  currentStep: string
}) {
  const payload = buildIntakePayload(args)
  const response = await fetch('/release-drafts/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draft_token: args.draftToken,
      workspace_slug: args.workspaceSlug,
      workflow_type: 'release_intake',
      current_step: args.currentStep,
      values: payload,
      meta: payload.meta,
    }),
  })
  if (!response.ok) throw await apiError(response, 'Falha ao salvar o rascunho no servidor.')
  return response.json()
}

export async function loadIntakeDraft(draftToken: string): Promise<LoadedIntakeDraft> {
  const response = await fetch(`/release-drafts/${encodeURIComponent(draftToken)}`)
  if (!response.ok) throw await apiError(response, 'Não foi possível carregar este rascunho.')
  const payload = await response.json() as Record<string, unknown>
  const draftData = record(payload.data)
  return {
    data: intakeDataFromStoredValues(draftData.values),
    currentStep: textValue(draftData.current_step) || 'identificacao',
    draftToken: textValue(payload.draft_token) || draftToken,
    updatedAt: textValue(payload.updated_at) || null,
    draftLinkEmailSent: payload.draft_link_email_sent === true,
  }
}

export async function sendIntakeDraftLink(args: {
  draftToken: string
  workspaceSlug: string
  toEmail: string
  recipientName: string
  projectTitle: string
}): Promise<DraftLinkEmailResult> {
  const response = await fetch('/release-drafts/send-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draft_token: args.draftToken,
      workspace_slug: args.workspaceSlug,
      workflow_type: 'release_intake',
      to_email: args.toEmail,
      recipient_name: args.recipientName,
      project_title: args.projectTitle,
    }),
  })
  if (!response.ok) throw await apiError(response, 'Não foi possível enviar o link do rascunho por e-mail.')
  return response.json()
}

export async function submitIntake(payload: ReturnType<typeof buildIntakePayload>) {
  const response = await fetch('/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await apiError(response, 'Não foi possível enviar o formulário.')
  return response.json()
}
