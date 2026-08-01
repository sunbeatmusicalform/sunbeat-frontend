import type { FormValues } from '@/engine/types'
import { uploadIntakeFile, type UploadedFileRef } from '@/lib/intake-api'

type ClearanceFormat = 'music_release_clearance_intake' | 'music_project_track' | 'audiovisual_product_sync'

function text(values: FormValues, key: string): string {
  return String(values[key] ?? '').trim()
}

function optional(values: FormValues, key: string): string | null {
  return text(values, key) || null
}

export function buildClearancePayload(values: FormValues, workspaceSlug: string, draftToken: string, supportingFiles: UploadedFileRef[] = []) {
  const format = text(values, 'clearance_format') as ClearanceFormat
  const isRelease = format === 'music_release_clearance_intake'
  const isAudiovisual = format === 'audiovisual_product_sync'
  const tracks = ((values.tracks as FormValues[] | undefined) ?? []).map((track, index) => ({
    local_id: crypto.randomUUID(),
    order_number: index + 1,
    title: text(track, 'title'),
    primary_artists: text(track, 'primary_artists'),
    authors: text(track, 'authors'),
    publishers: optional(track, 'publishers'),
    phonogram_owner: text(track, 'phonogram_owner'),
    has_isrc: optional(track, 'has_isrc'),
    isrc_code: optional(track, 'isrc_code'),
    notes_for_clearance: optional(track, 'notes_for_clearance'),
  }))

  return {
    draft_token: draftToken,
    workspace_slug: workspaceSlug,
    workflow_type: 'rights_clearance',
    requester_identification: {
      requester_name: text(values, 'requester_name'),
      requester_email: text(values, 'requester_email'),
      requester_company: text(values, 'requester_company'),
      requester_role: text(values, 'requester_role'),
    },
    request_type: { clearance_format: format },
    project_context: {
      project_title: text(values, 'project_title'),
      responsible_company: text(values, 'responsible_company'),
      client_or_distributor: text(values, 'client_or_distributor'),
      release_or_start_date: text(values, 'release_or_start_date'),
      release_type: isRelease ? optional(values, 'release_type') : null,
      project_synopsis: isAudiovisual ? optional(values, 'project_synopsis_av') : optional(values, 'project_synopsis'),
      has_brand_association: optional(values, 'has_brand_association'),
      brand_context: optional(values, 'brand_context'),
      general_clearance_notes: isRelease ? optional(values, 'general_clearance_notes') : null,
    },
    tracks: isRelease ? tracks : null,
    clearance_scope: isRelease ? null : {
      music_title: text(values, 'music_title'),
      artist_name: text(values, 'artist_name'),
      phonogram_owner: text(values, 'phonogram_owner'),
      territory: text(values, 'territory'),
      licensing_period: text(values, 'licensing_period'),
      composer_author_info: optional(values, 'composer_author_info'),
      publisher_info: optional(values, 'publisher_info'),
      material_type: optional(values, 'material_type'),
      intended_use: optional(values, 'intended_use'),
      exclusivity: optional(values, 'exclusivity'),
      audiovisual_type: optional(values, 'audiovisual_type'),
      director_name: optional(values, 'director_name'),
      product_or_campaign_name: optional(values, 'product_or_campaign_name'),
      scene_description: optional(values, 'scene_description'),
      sync_duration: optional(values, 'sync_duration'),
      media_channels: optional(values, 'media_channels'),
    },
    assets_references: {
      supporting_files: supportingFiles,
      reference_links: isAudiovisual ? optional(values, 'reference_links_av') : optional(values, 'reference_links'),
      additional_notes: isAudiovisual ? optional(values, 'additional_notes_av') : optional(values, 'additional_notes'),
    },
    meta: {
      form_version: 'rights_clearance_v1',
      source: `sunbeat:${workspaceSlug}:rights_clearance:v1`,
      submitted_at: new Date().toISOString(),
    },
  }
}

export async function submitClearance(values: FormValues, workspaceSlug: string, draftToken: string) {
  const format = text(values, 'clearance_format')
  const fileValue = values[format === 'audiovisual_product_sync' ? 'supporting_files_av' : 'supporting_files']
  const supportingFiles = fileValue instanceof File
    ? [await uploadIntakeFile({ file: fileValue, kind: 'asset', workspaceSlug, draftToken })]
    : []
  const response = await fetch('/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(buildClearancePayload(values, workspaceSlug, draftToken, supportingFiles)),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null
    const detail = typeof payload?.detail === 'string' ? payload.detail : 'Não foi possível enviar o pedido de clearance.'
    throw new Error(detail)
  }
  return response.json()
}
