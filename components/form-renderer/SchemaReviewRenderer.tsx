import type { CSSProperties } from "react";

import { AlertBlock } from "@/components/foundation/AlertBlock";
import { Button } from "@/components/foundation/Button";
import { Card } from "@/components/foundation/Card";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import type {
  FormSchema,
  FormStep,
  SchemaReviewSummary,
  SchemaValue,
  SchemaValueMap,
} from "@/lib/form-schema/types";

type SchemaReviewRendererProps = {
  onJumpToStep: (stepId: string) => void;
  schema: FormSchema;
  summary: SchemaReviewSummary;
  values: SchemaValueMap;
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gap: "var(--sbf-space-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
};

const summaryRowStyle: CSSProperties = {
  alignItems: "flex-start",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  display: "grid",
  gap: "var(--sbf-space-3)",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  padding: "var(--sbf-space-3)",
};

const valueRowStyle: CSSProperties = {
  borderTop: "1px solid var(--sbf-color-line)",
  display: "grid",
  gap: "var(--sbf-space-3)",
  gridTemplateColumns: "minmax(110px, 0.35fr) minmax(0, 1fr)",
  padding: "var(--sbf-space-3) 0 0",
};

const nextStepStyle: CSSProperties = {
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  display: "grid",
  gap: "var(--sbf-space-2)",
  padding: "var(--sbf-space-3)",
};

function formatReviewValue(value: SchemaValue | undefined): string {
  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "object" && "name" in value) {
    const name = value.name;
    return typeof name === "string" ? name : "Objeto mockado";
  }

  return "Objeto mockado";
}

function visibleReviewFields(step: FormStep) {
  return step.fields.filter((field) => field.kind !== "review");
}

function titleForStep(schema: FormSchema, stepId: string) {
  return schema.steps.find((step) => step.id === stepId)?.label ?? stepId;
}

export function SchemaReviewRenderer({
  onJumpToStep,
  schema,
  summary,
  values,
}: SchemaReviewRendererProps) {
  const blockerRows = summary.rows.filter((row) => row.tone === "danger");
  const warningRows = summary.rows.filter((row) => row.tone === "warn");
  const okRows = summary.rows.filter((row) => row.tone === "success");

  return (
    <div className="sbf-stack">
      <Card
        description="Hierarchy follows the Claude Design handoff: blockers first, warnings second, OKs last."
        eyebrow="AI pre-submit summary"
        title={summary.headline}
        tone={summary.counts.blockers > 0 ? "danger" : "success"}
      >
        <div className="sbf-stack">
          <div className="sbf-inline">
            <StatusBadge
              status={summary.counts.blockers > 0 ? "blocked" : "valid"}
              label={`${summary.counts.blockers} blockers`}
            />
            <StatusBadge status="warning" label={`${summary.counts.warnings} warnings`} />
            <StatusBadge status="valid" label={`${summary.counts.ok} OK`} />
          </div>
          <div className="sbf-stack-tight">
            {[...blockerRows, ...warningRows, ...okRows].map((row) => (
              <div key={row.text} style={summaryRowStyle}>
                <span>{row.text}</span>
                <Button
                  onClick={() => onJumpToStep(row.targetStepId)}
                  size="sm"
                  variant={row.tone === "danger" ? "danger" : "secondary"}
                >
                  Edit {titleForStep(schema, row.targetStepId)}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section style={summaryGridStyle}>
        {schema.steps
          .filter((step) => step.id !== "review")
          .map((step, index) => (
            <Card
              actions={
                <Button onClick={() => onJumpToStep(step.id)} size="sm" variant="ghost">
                  Edit
                </Button>
              }
              density="compact"
              eyebrow={`0${index + 1} - ${step.label}`}
              key={step.id}
              title={step.title}
            >
              <div className="sbf-stack-tight">
                {visibleReviewFields(step).map((field) => (
                  <div key={field.key} style={valueRowStyle}>
                    <span className="sbf-eyebrow">{field.label}</span>
                    <span>{formatReviewValue(values[field.key])}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </section>

      <Card
        description="These destinations are represented as schema metadata only. No endpoint, sync job or email sender is invoked."
        eyebrow="When a real submit exists"
        title="Operational destinations remain inactive in preview"
      >
        <div style={summaryGridStyle}>
          {summary.nextSteps.map((step, index) => (
            <div key={step.key} style={nextStepStyle}>
              <div className="sbf-inline">
                <StatusBadge status="not_synced" label={`0${index + 1}`} size="sm" />
                <strong>{step.title}</strong>
              </div>
              <span className="sbf-ai-meta">{step.description}</span>
            </div>
          ))}
        </div>
      </Card>

      <AlertBlock blocking="hard_block" title="Submit is intentionally unavailable" tone="danger">
        <p>
          This preview cannot publish, upload, sync, email, write a draft or call the active
          Atabaque runtime. A human must wire a future runtime explicitly after a separate diff
          review.
        </p>
      </AlertBlock>
    </div>
  );
}
