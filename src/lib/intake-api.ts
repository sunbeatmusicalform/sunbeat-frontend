import type { IntakeData } from '@/types/intake'

export interface UploadedFileRef {
  file_name: string
  storage_bucket: string
  storage_path: string
  public_url: string
  download_url: string
  mime_type: string
  size_bytes: number
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
      featured_artists: track.featArtists || null,
      interpreters: track.performers || null,
      authors: track.composers,
      phonographic_producer: track.producer,
      artist_profile_names_to_create: track.newArtistProfiles || null,
      existing_profile_links: track.existingProfileLinks || null,
      has_isrc: track.hasISRC || null,
      isrc_code: track.isrc || null,
      audio_file: audioFiles[track.id] ?? null,
    })),
    marketing: {
      marketing_focus: data.focusDescription || null,
      marketing_objectives: data.goals.join(', ') || null,
      focus_track_name: focusTrack?.title || null,
      has_special_guests: data.hasSpecialGuests ? 'yes' : 'no',
      special_guests_bio: data.guestsBio || null,
      feat_will_promote: data.guestsPromote === null ? null : data.guestsPromote ? 'yes' : 'no',
      promotion_participants: data.promoParticipants || null,
      influencers_brands_partners: data.influencers || null,
      general_notes: data.notes || null,
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
