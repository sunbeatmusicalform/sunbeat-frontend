import type {
  BillingAndEntitlementsReadModel,
  BillingEntitlements,
} from "@/lib/workspace-config/types";

type Props = {
  billing: BillingAndEntitlementsReadModel;
};

type EntitlementKey = keyof BillingEntitlements;

const ENTITLEMENT_FIELDS: Array<{
  key: EntitlementKey;
  label: string;
}> = [
  { key: "aiEnabled", label: "AI enabled" },
  { key: "aiMonthlyBudgetBrl", label: "AI monthly budget (BRL)" },
  { key: "aiOveragePolicy", label: "AI overage policy" },
  { key: "aiGeminiReserveBrl", label: "AI Gemini reserve (BRL)" },
  { key: "maxSubmissionsMonth", label: "Max submissions / month" },
  { key: "audioUploadMb", label: "Audio upload" },
  { key: "coverUploadMb", label: "Cover upload" },
  { key: "airtableEnabled", label: "Airtable enabled" },
  { key: "gdriveEnabled", label: "Google Drive enabled" },
  { key: "supportTier", label: "Support tier" },
  { key: "slaResponseHours", label: "SLA response hours" },
  { key: "enabledWorkflowTypes", label: "Enabled workflow types" },
];

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatBoolean(value: boolean) {
  return value ? "Enabled" : "Disabled";
}

function formatNullableNumber(
  value: number | null,
  {
    suffix,
    nullLabel = "Not set",
  }: {
    suffix?: string;
    nullLabel?: string;
  } = {}
) {
  if (value === null) {
    return nullLabel;
  }

  return suffix ? `${value} ${suffix}` : String(value);
}

function formatWorkflowTypes(value: string[] | null) {
  if (!value || value.length === 0) {
    return "All workflows";
  }

  return value.join(", ");
}

function formatSupportTier(value: BillingEntitlements["supportTier"]) {
  return value
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function formatOveragePolicy(value: BillingEntitlements["aiOveragePolicy"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatEntitlementValue(
  key: EntitlementKey,
  value: BillingEntitlements[EntitlementKey]
) {
  switch (key) {
    case "aiEnabled":
    case "airtableEnabled":
    case "gdriveEnabled":
      return formatBoolean(value as boolean);
    case "aiMonthlyBudgetBrl":
    case "aiGeminiReserveBrl":
      return brlFormatter.format((value as number) ?? 0);
    case "audioUploadMb":
    case "coverUploadMb":
      return formatNullableNumber(value as number | null, { suffix: "MB" });
    case "maxSubmissionsMonth":
      return formatNullableNumber(value as number | null, {
        nullLabel: "Unlimited",
      });
    case "slaResponseHours":
      return formatNullableNumber(value as number | null, {
        suffix: "h",
      });
    case "enabledWorkflowTypes":
      return formatWorkflowTypes(value as string[] | null);
    case "supportTier":
      return formatSupportTier(value as BillingEntitlements["supportTier"]);
    case "aiOveragePolicy":
      return formatOveragePolicy(value as BillingEntitlements["aiOveragePolicy"]);
    default:
      return String(value);
  }
}

function formatContractValue(value: number | null) {
  return value === null ? "Not set" : brlFormatter.format(value);
}

function formatDate(value: string | null) {
  return value || "Not set";
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-black/8 bg-[#FAFAF8] px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[#111111]">{value}</div>
    </div>
  );
}

function ContractRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-amber-200/80 bg-white/75 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900/65">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-[#111111]">{value}</div>
    </div>
  );
}

export default function WorkspaceBillingEntitlementsPanel({ billing }: Props) {
  if (billing.state !== "loaded") {
    return (
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-black/10 bg-[#F8F5EF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B655C]">
            Internal admin
          </span>
          <span className="rounded-full border border-black/10 bg-[#F8F5EF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B655C]">
            Read-only
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111]">
          Billing and entitlements
        </h2>
        <p className="mt-2 text-sm leading-7 text-[#5F5A53]">{billing.note}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-black/10 bg-[#F8F5EF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B655C]">
          Internal admin
        </span>
        <span className="rounded-full border border-black/10 bg-[#F8F5EF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B655C]">
          Read-only
        </span>
        <span
          className={[
            "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            billing.source === "plan_with_override"
              ? "border border-amber-200 bg-amber-50 text-amber-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800",
          ].join(" ")}
        >
          {billing.source}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]">
            Billing and entitlements
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5F5A53]">
            Effective workspace entitlements resolved from the base plan with
            workspace-level overrides highlighted row by row.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
          Contract info is sensitive
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="planName" value={billing.planName} />
        <SummaryTile
          label="isConsultingPlan"
          value={billing.isConsultingPlan ? "Yes" : "No"}
        />
        <SummaryTile label="source" value={billing.source} />
        <SummaryTile
          label="override status"
          value={
            billing.source === "plan_with_override"
              ? "Workspace override active"
              : "Base plan only"
          }
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[24px] border border-black/8 bg-[#FAFAF8] px-5 py-5">
          <div className="flex items-center justify-between gap-3 border-b border-black/6 pb-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
                Effective entitlements
              </div>
              <div className="mt-1 text-sm text-[#5F5A53]">
                Each row shows the current resolved value and where it came from.
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {ENTITLEMENT_FIELDS.map((field) => {
              const source = billing.entitlementSources[field.key];
              const effectiveValue = formatEntitlementValue(
                field.key,
                billing.entitlements[field.key]
              );
              const basePlanValue = formatEntitlementValue(
                field.key,
                billing.basePlanEntitlements[field.key]
              );
              const isOverride = source === "override";

              return (
                <div
                  key={field.key}
                  className="rounded-[18px] border border-black/8 bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8D867B]">
                        {field.label}
                      </div>
                      <div className="mt-2 break-words text-sm font-semibold text-[#111111]">
                        {effectiveValue}
                      </div>
                      {isOverride && (
                        <div className="mt-2 text-xs text-[#6B655C]">
                          Base plan: {basePlanValue}
                        </div>
                      )}
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        isOverride
                          ? "border border-amber-200 bg-amber-50 text-amber-800"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-800",
                      ].join(" ")}
                    >
                      {isOverride ? "Workspace override" : "Base plan"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-300 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900">
              Sensitive
            </span>
            <span className="rounded-full border border-amber-300 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900">
              Not sent to AI context
            </span>
          </div>

          <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#111111]">
            Contract information
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#6B655C]">
            Separate from entitlements and intended only for internal admin use.
          </p>

          <div className="mt-4 space-y-3">
            <ContractRow
              label="Monthly value"
              value={formatContractValue(billing.contractInfo.monthlyValueBrl)}
            />
            <ContractRow
              label="Setup fee paid"
              value={formatContractValue(billing.contractInfo.setupFeePaidBrl)}
            />
            <ContractRow
              label="Billing cycle"
              value={billing.contractInfo.billingCycle || "Not set"}
            />
            <ContractRow
              label="Contract start"
              value={formatDate(billing.contractInfo.contractStartDate)}
            />
            <ContractRow
              label="Contract end"
              value={formatDate(billing.contractInfo.contractEndDate)}
            />
            <ContractRow
              label="Configured by"
              value={billing.contractInfo.configuredBy || "Not set"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
