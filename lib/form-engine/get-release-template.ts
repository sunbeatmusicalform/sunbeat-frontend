import { atabaqueTemplate } from "./atabaque-template";
import type { ReleaseIntakeTemplate } from "./types";

type BrandingConfig = {
  workspace_slug: string;
  workspace_name?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  slogan?: string | null;
  form_title?: string | null;
  intro_text?: string | null;
  success_message?: string | null;
};

type FieldOverride = {
  step_key: string;
  field_key: string;
  label_override?: string | null;
  helper_text_override?: string | null;
  placeholder_override?: string | null;
  is_required?: boolean | null;
  is_visible?: boolean | null;
  sort_order?: number | null;
};

type WorkspaceConfigResponse = {
  ok: boolean;
  branding?: BrandingConfig | null;
  field_overrides?: FieldOverride[];
};

const MOJIBAKE_PATTERN = /[ÃÂâ�]/;

function normalizePossiblyMisencodedText<T extends string | null | undefined>(
  value: T
): T {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(
      Array.from(value),
      (char) => char.charCodeAt(0) & 0xff
    );
    const decoded = new TextDecoder("utf-8").decode(bytes);

    if (decoded.includes("\uFFFD") && !value.includes("\uFFFD")) {
      return value;
    }

    return decoded as T;
  } catch {
    return value;
  }
}

function hasTextOverride(value: string | null | undefined) {
  return typeof value === "string";
}

export async function getReleaseTemplate(
  workspaceSlug: string
): Promise<ReleaseIntakeTemplate> {
  const cacheKey = Date.now();
  const res = await fetch(
    `/api/workspaces/${workspaceSlug}/release-intake-config?ts=${cacheKey}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return atabaqueTemplate;
  }

  const data = (await res.json()) as WorkspaceConfigResponse;

  const baseTemplate: ReleaseIntakeTemplate = {
    ...atabaqueTemplate,
    workspaceSlug,
  };

  const branding = data.branding
    ? {
        ...data.branding,
        workspace_name: normalizePossiblyMisencodedText(
          data.branding.workspace_name
        ),
        slogan: normalizePossiblyMisencodedText(data.branding.slogan),
        form_title: normalizePossiblyMisencodedText(data.branding.form_title),
        intro_text: normalizePossiblyMisencodedText(data.branding.intro_text),
        success_message: normalizePossiblyMisencodedText(
          data.branding.success_message
        ),
      }
    : null;

  const overrides =
    data.field_overrides?.map((override) => ({
      ...override,
      label_override: normalizePossiblyMisencodedText(override.label_override),
      helper_text_override: normalizePossiblyMisencodedText(
        override.helper_text_override
      ),
      placeholder_override: normalizePossiblyMisencodedText(
        override.placeholder_override
      ),
    })) ?? [];

  const nextTemplate: ReleaseIntakeTemplate = {
    ...baseTemplate,
    slogan: branding?.slogan || baseTemplate.slogan,
    successMessage: branding?.success_message || baseTemplate.successMessage,
    intro: {
      ...baseTemplate.intro,
      clientName: branding?.workspace_name || baseTemplate.intro.clientName,
      formTitle: branding?.form_title || baseTemplate.intro.formTitle,
      introText: branding?.intro_text || baseTemplate.intro.introText,
      logoUrl: branding?.logo_url || baseTemplate.intro.logoUrl,
      bannerUrl: branding?.banner_url || baseTemplate.intro.bannerUrl,
      brandWordmark:
        baseTemplate.intro.brandWordmark ||
        branding?.workspace_name ||
        baseTemplate.intro.clientName,
      supportLogoUrl: baseTemplate.intro.supportLogoUrl,
      supportLogoAlt: baseTemplate.intro.supportLogoAlt,
      supportLabel: baseTemplate.intro.supportLabel,
      highlights: baseTemplate.intro.highlights,
    },
    steps: baseTemplate.steps.map((step) => {
      const stepOverrides = overrides
        .filter((item) => item.step_key === step.key)
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));

      const overriddenFields = step.fields
        .map((field) => {
          const match = stepOverrides.find((item) => item.field_key === field.key);
          if (!match) return field;
          if (match.is_visible === false) return null;

          return {
            ...field,
            label:
              match.label_override && match.label_override.trim().length > 0
                ? match.label_override
                : field.label,
            helperText: hasTextOverride(match.helper_text_override)
              ? match.helper_text_override
              : field.helperText,
            placeholder: hasTextOverride(match.placeholder_override)
              ? match.placeholder_override
              : field.placeholder,
            required:
              typeof match.is_required === "boolean"
                ? match.is_required
                : field.required,
          };
        })
        .filter(Boolean);

      return {
        ...step,
        fields: overriddenFields as typeof step.fields,
      };
    }),
  };

  return nextTemplate;
}
