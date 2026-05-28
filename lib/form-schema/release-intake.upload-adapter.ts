import type { UploadedFileRef } from "../form-engine/types";
import {
  deriveReleaseIntakeCoverSpecs,
  type ReleaseIntakeCoverSpec,
  type ReleaseIntakeFileStatus,
  type ReleaseIntakeSchemaAudioFileValue,
  type ReleaseIntakeSchemaCoverFileValue,
  type ReleaseIntakeSchemaValues,
} from "./release-intake.draft-adapter";

export type ReleaseIntakeUploadKind = "cover" | "audio" | "asset";

export type ReleaseIntakeUploadParityStatus =
  | "requires_upload_runtime"
  | "requires_storage_policy"
  | "requires_drive_mapping"
  | "requires_submit_integration"
  | "visual_only_metadata";

export type ReleaseIntakeUploadRuntimeTarget = {
  uploadKind: ReleaseIntakeUploadKind;
  runtimePayloadPath: string;
  uploadRequestKind: ReleaseIntakeUploadKind;
  storageFolder: "cover" | "audio" | "assets";
  maxSizeBytes: number;
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
  requiresDraftToken: true;
  requiresTrackLocalId?: true;
};

export type ReleaseIntakeUploadFileMetadata = {
  id: string;
  name: string;
  size: string;
  status: ReleaseIntakeFileStatus;
  mimeType?: string;
  sizeBytes?: number;
  storageBucket?: string;
  storagePath?: string;
  publicUrl?: string;
  downloadUrl?: string;
};

export type ReleaseIntakeCoverUploadFileMetadata =
  ReleaseIntakeUploadFileMetadata & {
    width: number;
    height: number;
    dpi: number;
    preview: boolean;
  };

export type ReleaseIntakeCoverUploadCandidate = {
  kind: "cover";
  field: "assets.cover_file";
  file: ReleaseIntakeCoverUploadFileMetadata;
  specs: ReleaseIntakeCoverSpec[];
  blockers: ReleaseIntakeCoverSpec["key"][];
  computedOnly: true;
  runtimeTarget: ReleaseIntakeUploadRuntimeTarget;
};

export type ReleaseIntakeTrackAudioUploadCandidate = {
  kind: "audio";
  field: "tracks[].audio_file";
  trackId: string;
  trackLocalId: string;
  trackOrder: number;
  trackTitle: string;
  file: ReleaseIntakeUploadFileMetadata;
  runtimeTarget: ReleaseIntakeUploadRuntimeTarget;
};

export type ReleaseIntakeMarketingAdditionalFileInput = UploadedFileRef & {
  status?: ReleaseIntakeFileStatus;
  category?: string;
};

export type ReleaseIntakeMarketingAdditionalFileUploadCandidate = {
  kind: "asset";
  field: "marketing.additional_files";
  category?: string;
  file: ReleaseIntakeUploadFileMetadata;
  runtimeTarget: ReleaseIntakeUploadRuntimeTarget;
};

export type ReleaseIntakeUploadManifestExclusion = {
  field: string;
  reason:
    | "no_schema_metadata"
    | "no_audio_for_track"
    | "computed_visual_only"
    | "runtime_only";
  message: string;
  trackLocalId?: string;
};

export type ReleaseIntakeUploadPendingRuntimeIntegration = {
  status: Exclude<ReleaseIntakeUploadParityStatus, "visual_only_metadata">;
  fields: readonly string[];
  message: string;
};

export type ReleaseIntakeUploadManifestCandidate = {
  generatedFrom: "release_intake_schema_upload_parity_v0";
  cover: ReleaseIntakeCoverUploadCandidate | null;
  trackAudio: ReleaseIntakeTrackAudioUploadCandidate[];
  marketingAdditionalFiles: ReleaseIntakeMarketingAdditionalFileUploadCandidate[];
  excluded: ReleaseIntakeUploadManifestExclusion[];
  pendingRuntimeIntegration: ReleaseIntakeUploadPendingRuntimeIntegration[];
};

export type ReleaseIntakeUploadParityFinding = {
  code: string;
  status: ReleaseIntakeUploadParityStatus;
  field: string;
  message: string;
  schemaPath?: string;
  runtimePath?: string;
};

export type ReleaseIntakeUploadParitySummary = {
  manifestCandidate: ReleaseIntakeUploadManifestCandidate;
  findings: ReleaseIntakeUploadParityFinding[];
  counts: Record<ReleaseIntakeUploadParityStatus, number>;
};

export type ReleaseIntakeUploadManifestOptions = {
  marketingAdditionalFiles?: readonly ReleaseIntakeMarketingAdditionalFileInput[];
};

export const RELEASE_INTAKE_UPLOAD_RUNTIME_TARGETS = {
  cover: {
    uploadKind: "cover",
    runtimePayloadPath: "project.cover_file",
    uploadRequestKind: "cover",
    storageFolder: "cover",
    maxSizeBytes: 50 * 1024 * 1024,
    allowedExtensions: [".jpg", ".jpeg", ".png"],
    allowedMimeTypes: ["image/jpeg", "image/png"],
    requiresDraftToken: true,
  },
  audio: {
    uploadKind: "audio",
    runtimePayloadPath: "tracks[].audio_file",
    uploadRequestKind: "audio",
    storageFolder: "audio",
    maxSizeBytes: 100 * 1024 * 1024,
    allowedExtensions: [".wav", ".mp3"],
    allowedMimeTypes: ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3"],
    requiresDraftToken: true,
    requiresTrackLocalId: true,
  },
  asset: {
    uploadKind: "asset",
    runtimePayloadPath: "marketing.additional_files",
    uploadRequestKind: "asset",
    storageFolder: "assets",
    maxSizeBytes: 50 * 1024 * 1024,
    allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf", ".zip"],
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ],
    requiresDraftToken: true,
  },
} as const satisfies Record<
  ReleaseIntakeUploadKind,
  ReleaseIntakeUploadRuntimeTarget
>;

function fileRefMetadata(runtimeFileRef: UploadedFileRef | undefined) {
  return {
    mimeType: runtimeFileRef?.mime_type,
    sizeBytes: runtimeFileRef?.size_bytes,
    storageBucket: runtimeFileRef?.storage_bucket,
    storagePath: runtimeFileRef?.storage_path,
    publicUrl: runtimeFileRef?.public_url,
    downloadUrl: runtimeFileRef?.download_url,
  };
}

function compactMetadata(metadata: ReleaseIntakeUploadFileMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  ) as ReleaseIntakeUploadFileMetadata;
}

function audioFileToUploadMetadata(
  file: ReleaseIntakeSchemaAudioFileValue
): ReleaseIntakeUploadFileMetadata {
  return compactMetadata({
    id: file.id,
    name: file.name,
    size: file.size,
    status: file.status,
    ...fileRefMetadata(file.runtimeFileRef),
  });
}

function coverFileToUploadMetadata(
  file: ReleaseIntakeSchemaCoverFileValue
): ReleaseIntakeCoverUploadFileMetadata {
  return {
    ...compactMetadata({
      id: file.id,
      name: file.name,
      size: file.size,
      status: file.status,
      ...fileRefMetadata(file.runtimeFileRef),
    }),
    width: file.width,
    height: file.height,
    dpi: file.dpi,
    preview: file.preview,
  };
}

function marketingFileToUploadMetadata(
  file: ReleaseIntakeMarketingAdditionalFileInput
): ReleaseIntakeUploadFileMetadata {
  return compactMetadata({
    id: `asset:${file.file_id}`,
    name: file.file_name,
    size:
      typeof file.size_bytes === "number"
        ? `${Math.round(file.size_bytes / (1024 * 1024))} MB`
        : "",
    status: file.status ?? "unknown",
    mimeType: file.mime_type,
    sizeBytes: file.size_bytes,
    storageBucket: file.storage_bucket,
    storagePath: file.storage_path,
    publicUrl: file.public_url,
    downloadUrl: file.download_url,
  });
}

function coverSpecsForInput(input: ReleaseIntakeSchemaValues) {
  if (input.assets.cover_specs.length > 0) {
    return input.assets.cover_specs;
  }

  return deriveReleaseIntakeCoverSpecs(input.assets.cover_file);
}

function buildPendingRuntimeIntegration(
  manifestFields: readonly string[]
): ReleaseIntakeUploadPendingRuntimeIntegration[] {
  return [
    {
      status: "requires_upload_runtime",
      fields: manifestFields,
      message:
        "The manifest is metadata-only and must be connected to the existing upload runtime in a future opt-in PR.",
    },
    {
      status: "requires_storage_policy",
      fields: manifestFields,
      message:
        "Bucket names, size limits, MIME checks and signed upload policy must remain owned by the active upload route.",
    },
    {
      status: "requires_drive_mapping",
      fields: manifestFields,
      message:
        "Drive placement and naming need a separate review before schema upload metadata can affect integrations.",
    },
    {
      status: "requires_submit_integration",
      fields: manifestFields,
      message:
        "Submit payloads must explicitly accept uploaded refs before this manifest can be serialized.",
    },
  ];
}

function createFinding(
  finding: ReleaseIntakeUploadParityFinding
): ReleaseIntakeUploadParityFinding {
  return finding;
}

function countFindings(findings: ReleaseIntakeUploadParityFinding[]) {
  const counts: Record<ReleaseIntakeUploadParityStatus, number> = {
    requires_upload_runtime: 0,
    requires_storage_policy: 0,
    requires_drive_mapping: 0,
    requires_submit_integration: 0,
    visual_only_metadata: 0,
  };

  findings.forEach((finding) => {
    counts[finding.status] += 1;
  });

  return counts;
}

function hasRuntimeBinaryValue(
  value: unknown,
  seen = new WeakSet<object>()
): boolean {
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (typeof value !== "object" || value === null) return false;

  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => hasRuntimeBinaryValue(item, seen));
  }

  return Object.values(value as Record<string, unknown>).some((item) =>
    hasRuntimeBinaryValue(item, seen)
  );
}

export function releaseIntakeUploadManifestContainsRuntimeBinary(
  manifest: ReleaseIntakeUploadManifestCandidate
) {
  return hasRuntimeBinaryValue(manifest);
}

export function releaseIntakeSchemaValuesToUploadManifestCandidate(
  input: ReleaseIntakeSchemaValues,
  options: ReleaseIntakeUploadManifestOptions = {}
): ReleaseIntakeUploadManifestCandidate {
  const coverSpecs = coverSpecsForInput(input);
  const cover: ReleaseIntakeCoverUploadCandidate | null = input.assets
    .cover_file
    ? {
        kind: "cover",
        field: "assets.cover_file",
        file: coverFileToUploadMetadata(input.assets.cover_file),
        specs: coverSpecs,
        blockers: coverSpecs
          .filter((spec) => !spec.ok && spec.weight === "blocker")
          .map((spec) => spec.key),
        computedOnly: true,
        runtimeTarget: RELEASE_INTAKE_UPLOAD_RUNTIME_TARGETS.cover,
      }
    : null;

  const trackAudio: ReleaseIntakeTrackAudioUploadCandidate[] = input.tracks
    .filter((track) => track.audio_file)
    .map((track, index) => {
      const audioFile = track.audio_file as ReleaseIntakeSchemaAudioFileValue;
      return {
        kind: "audio",
        field: "tracks[].audio_file",
        trackId: track.id,
        trackLocalId: audioFile.trackLocalId || track.local_id,
        trackOrder: track.order || index + 1,
        trackTitle: track.title,
        file: audioFileToUploadMetadata(audioFile),
        runtimeTarget: RELEASE_INTAKE_UPLOAD_RUNTIME_TARGETS.audio,
      };
    });

  const marketingAdditionalFiles: ReleaseIntakeMarketingAdditionalFileUploadCandidate[] =
    options.marketingAdditionalFiles?.map((file) => ({
      kind: "asset",
      field: "marketing.additional_files",
      category: file.category,
      file: marketingFileToUploadMetadata(file),
      runtimeTarget: RELEASE_INTAKE_UPLOAD_RUNTIME_TARGETS.asset,
    })) ?? [];

  const excluded: ReleaseIntakeUploadManifestExclusion[] = [
    ...input.tracks
      .filter((track) => !track.audio_file)
      .map((track) => ({
        field: "tracks[].audio_file",
        reason: "no_audio_for_track" as const,
        trackLocalId: track.local_id,
        message: `No schema audio metadata exists for track ${track.local_id}.`,
      })),
  ];

  if (!cover) {
    excluded.push({
      field: "assets.cover_file",
      reason: "no_schema_metadata",
      message: "No schema cover metadata exists.",
    });
  }

  if (coverSpecs.length > 0) {
    excluded.push({
      field: "assets.cover_specs",
      reason: "computed_visual_only",
      message:
        "Cover specs are derived metadata and are not candidates for upload.",
    });
  }

  if (marketingAdditionalFiles.length === 0) {
    excluded.push({
      field: "marketing.additional_files",
      reason: "runtime_only",
      message:
        "Runtime marketing asset uploads are not represented in schema values yet.",
    });
  }

  const manifestFields = [
    ...(cover ? ["assets.cover_file"] : []),
    ...(trackAudio.length > 0 ? ["tracks[].audio_file"] : []),
    ...(marketingAdditionalFiles.length > 0
      ? ["marketing.additional_files"]
      : []),
  ];

  return {
    generatedFrom: "release_intake_schema_upload_parity_v0",
    cover,
    trackAudio,
    marketingAdditionalFiles,
    excluded,
    pendingRuntimeIntegration: buildPendingRuntimeIntegration(manifestFields),
  };
}

export const toUploadManifest =
  releaseIntakeSchemaValuesToUploadManifestCandidate;

export function summarizeReleaseIntakeUploadParity(
  input: ReleaseIntakeSchemaValues,
  options: ReleaseIntakeUploadManifestOptions = {}
): ReleaseIntakeUploadParitySummary {
  const manifestCandidate = releaseIntakeSchemaValuesToUploadManifestCandidate(
    input,
    options
  );
  const findings: ReleaseIntakeUploadParityFinding[] = [];
  const hasUploadCandidate =
    Boolean(manifestCandidate.cover) ||
    manifestCandidate.trackAudio.length > 0 ||
    manifestCandidate.marketingAdditionalFiles.length > 0;

  if (hasUploadCandidate) {
    findings.push(
      createFinding({
        code: "upload_runtime_required",
        status: "requires_upload_runtime",
        field: "upload_manifest",
        schemaPath: "assets.cover_file | tracks[].audio_file",
        runtimePath: "/api/uploads",
        message:
          "Schema metadata can describe upload candidates, but the active upload runtime must create signed upload URLs.",
      }),
      createFinding({
        code: "storage_policy_required",
        status: "requires_storage_policy",
        field: "upload_manifest",
        runtimePath: "/api/uploads",
        message:
          "Storage buckets, allowed MIME types and file-size limits remain runtime policy.",
      }),
      createFinding({
        code: "drive_mapping_required",
        status: "requires_drive_mapping",
        field: "upload_manifest",
        message:
          "Drive mapping is intentionally pending and is not inferred from schema metadata.",
      }),
      createFinding({
        code: "submit_integration_required",
        status: "requires_submit_integration",
        field: "upload_manifest",
        runtimePath: "buildWorkflowSubmitPayload",
        message:
          "Submit parity must explicitly decide how uploaded refs enter payloads.",
      })
    );
  }

  if (manifestCandidate.cover) {
    findings.push(
      createFinding({
        code: "cover_specs_computed_visual_only",
        status: "visual_only_metadata",
        field: "assets.cover_specs",
        schemaPath: "assets.cover_specs",
        runtimePath: "project.cover_file",
        message:
          "Cover resolution, DPI and status blockers are computed for preview and stay out of upload requests.",
      })
    );
  }

  if (manifestCandidate.trackAudio.length > 0) {
    findings.push(
      createFinding({
        code: "track_audio_metadata_visual_only",
        status: "visual_only_metadata",
        field: "tracks[].audio_file",
        schemaPath: "tracks[].audio_file",
        runtimePath: "tracks[].audio_file",
        message:
          "Per-track audio refs are metadata-only until the runtime upload flow is explicitly connected.",
      })
    );
  }

  if (manifestCandidate.marketingAdditionalFiles.length === 0) {
    findings.push(
      createFinding({
        code: "marketing_additional_files_not_in_schema_values",
        status: "visual_only_metadata",
        field: "marketing.additional_files",
        runtimePath: "marketing.additional_files",
        message:
          "Marketing additional uploads are runtime-only unless supplied to the adapter as explicit fixture metadata.",
      })
    );
  }

  return {
    manifestCandidate,
    findings,
    counts: countFindings(findings),
  };
}
