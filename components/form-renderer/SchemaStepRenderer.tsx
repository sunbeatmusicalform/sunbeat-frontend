import type { CSSProperties } from "react";

import { AISuggestion } from "@/components/foundation/AISuggestion";
import { Button } from "@/components/foundation/Button";
import { Card } from "@/components/foundation/Card";
import type {
  AISignalSpec,
  FormSchema,
  FormStep,
  SchemaReviewSummary,
  SchemaRendererMode,
  SchemaValue,
  SchemaValueMap,
} from "@/lib/form-schema/types";

import { SchemaReviewRenderer } from "./SchemaReviewRenderer";
import { SchemaFieldRenderer } from "./SchemaFieldRenderer";

type SchemaStepRendererProps = {
  mode: SchemaRendererMode;
  onJumpToStep: (stepId: string) => void;
  onValueChange: (key: string, value: SchemaValue) => void;
  schema: FormSchema;
  step: FormStep;
  summary: SchemaReviewSummary;
  values: SchemaValueMap;
};

const stepHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "var(--sbf-space-2)",
};

const fieldsGridStyle: CSSProperties = {
  display: "grid",
  gap: "var(--sbf-space-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
};

function renderSignalActions(
  signal: AISignalSpec,
  onJumpToStep: (stepId: string) => void,
) {
  if (!signal.actions?.length) {
    return null;
  }

  return (
    <>
      {signal.actions.map((action) => (
        <Button
          disabled={action.kind === "disabled_preview"}
          key={`${signal.id}-${action.label}`}
          onClick={() => {
            if (action.kind === "jump" && action.targetStepId) {
              onJumpToStep(action.targetStepId);
            }
          }}
          size="sm"
          variant={action.kind === "jump" ? "primary" : "secondary"}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}

function renderSignal(
  signal: AISignalSpec,
  onJumpToStep: (stepId: string) => void,
) {
  return (
    <AISuggestion
      actions={renderSignalActions(signal, onJumpToStep)}
      allowedActions={signal.allowedActions}
      blocking={signal.blocking ?? "none"}
      confidence={signal.confidence}
      key={signal.id}
      recommendation={signal.recommendation}
      requiresHumanApproval={signal.requiresHumanApproval ?? true}
      summary={signal.summary}
      title={signal.title}
      tone={signal.tone}
      validationState={signal.validationState ?? "pending"}
    />
  );
}

export function SchemaStepRenderer({
  mode,
  onJumpToStep,
  onValueChange,
  schema,
  step,
  summary,
  values,
}: SchemaStepRendererProps) {
  if (step.id === "review") {
    return (
      <SchemaReviewRenderer
        onJumpToStep={onJumpToStep}
        schema={schema}
        summary={summary}
        values={values}
      />
    );
  }

  return (
    <div className="sbf-stack">
      <Card
        description={step.description}
        eyebrow="Release intake schema v0"
        title={step.title}
      >
        <div className="sbf-stack">
          <div style={stepHeaderStyle}>
            <span className="sbf-ai-meta">
              This step is rendered from schema metadata and local mock values.
            </span>
          </div>
          {step.alerts?.length ? (
            <div className="sbf-stack-tight">
              {step.alerts.map((signal) => renderSignal(signal, onJumpToStep))}
            </div>
          ) : null}
          {step.aiSignals?.length ? (
            <div className="sbf-stack-tight">
              {step.aiSignals.map((signal) => renderSignal(signal, onJumpToStep))}
            </div>
          ) : null}
          <div style={fieldsGridStyle}>
            {step.fields.map((field) => (
              <SchemaFieldRenderer
                field={field}
                key={field.key}
                mode={mode}
                onJumpToStep={onJumpToStep}
                onValueChange={onValueChange}
                value={values[field.key]}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
