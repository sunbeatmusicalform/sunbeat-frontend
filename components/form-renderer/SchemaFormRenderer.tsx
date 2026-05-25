"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { StatusBadge } from "@/components/foundation/StatusBadge";
import type {
  FormSchema,
  SchemaReviewSummary,
  SchemaRendererMode,
  SchemaValue,
  SchemaValueMap,
} from "@/lib/form-schema/types";

import { SchemaProgress } from "./SchemaProgress";
import { SchemaSaveFooter } from "./SchemaSaveFooter";
import { SchemaStepRenderer } from "./SchemaStepRenderer";

type SchemaFormRendererProps = {
  initialValues: SchemaValueMap;
  mode?: SchemaRendererMode;
  schema: FormSchema;
  summary: SchemaReviewSummary;
};

const rootStyle: CSSProperties = {
  background: "var(--sbf-color-page)",
  color: "var(--sbf-color-ink)",
  minHeight: "100vh",
};

const stageHeaderStyle: CSSProperties = {
  backdropFilter: "blur(20px)",
  background: "rgba(246, 242, 234, 0.94)",
  borderBottom: "1px solid var(--sbf-color-line)",
  position: "sticky",
  top: 0,
  zIndex: 20,
};

const stageInnerStyle: CSSProperties = {
  alignItems: "center",
  display: "grid",
  gap: "var(--sbf-space-4)",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  margin: "0 auto",
  maxWidth: 1180,
  padding: "var(--sbf-space-4) var(--sbf-space-5)",
  width: "min(100%, 1180px)",
};

const markStyle: CSSProperties = {
  alignItems: "center",
  background: "linear-gradient(135deg, #fbbf24, #ef5f3c)",
  borderRadius: "var(--sbf-radius-sm)",
  color: "#111111",
  display: "inline-flex",
  fontSize: "0.8125rem",
  fontWeight: 850,
  height: 42,
  justifyContent: "center",
  width: 42,
};

const titleRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "var(--sbf-space-3)",
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 800,
  lineHeight: 1.2,
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  color: "var(--sbf-color-muted)",
  fontSize: "0.875rem",
  margin: "0.15rem 0 0",
};

const mainStyle: CSSProperties = {
  display: "grid",
  gap: "var(--sbf-space-5)",
  margin: "0 auto",
  maxWidth: 1180,
  padding: "var(--sbf-space-5)",
};

function clampStep(index: number, total: number) {
  return Math.max(0, Math.min(index, total - 1));
}

function findStepIndex(schema: FormSchema, stepId: string) {
  const index = schema.steps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

export function SchemaFormRenderer({
  initialValues,
  mode = "preview",
  schema,
  summary,
}: SchemaFormRendererProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [values, setValues] = useState<SchemaValueMap>(initialValues);
  const activeStep = schema.steps[activeStepIndex] ?? schema.steps[0];

  const blockers = summary.counts.blockers;
  const warnings = summary.counts.warnings;

  const activeStepLabel = useMemo(
    () => `${activeStep.label} (${activeStepIndex + 1}/${schema.steps.length})`,
    [activeStep.label, activeStepIndex, schema.steps.length],
  );

  const goToStep = (stepId: string) => {
    setActiveStepIndex(findStepIndex(schema, stepId));
  };

  const goBack = () => {
    setActiveStepIndex((current) => clampStep(current - 1, schema.steps.length));
  };

  const goNext = () => {
    setActiveStepIndex((current) => clampStep(current + 1, schema.steps.length));
  };

  const updateValue = (key: string, value: SchemaValue) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="sbf-root" style={rootStyle}>
      <header style={stageHeaderStyle}>
        <div style={stageInnerStyle}>
          <div style={titleRowStyle}>
            <span aria-hidden="true" style={markStyle}>
              SB
            </span>
            <div>
              <p className="sbf-eyebrow">Internal dev preview</p>
              <h1 style={titleStyle}>{schema.title}</h1>
              <p style={subtitleStyle}>{schema.description}</p>
            </div>
          </div>
          <div className="sbf-inline">
            <StatusBadge status="not_synced" label="No API calls" />
            <StatusBadge status="blocked" label="No runtime submit" />
            <StatusBadge status={blockers > 0 ? "blocked" : "valid"} label={schema.modeLabel} />
          </div>
        </div>
      </header>

      <main style={mainStyle}>
        <SchemaProgress
          activeStepId={activeStep.id}
          onStepChange={goToStep}
          steps={schema.steps}
        />
        <SchemaStepRenderer
          mode={mode}
          onJumpToStep={goToStep}
          onValueChange={updateValue}
          schema={schema}
          step={activeStep}
          summary={summary}
          values={values}
        />
      </main>

      <SchemaSaveFooter
        activeStepLabel={activeStepLabel}
        blockers={blockers}
        canGoBack={activeStepIndex > 0}
        canGoNext={activeStepIndex < schema.steps.length - 1}
        isLastStep={activeStepIndex === schema.steps.length - 1}
        mode={mode}
        onBack={goBack}
        onNext={goNext}
        warnings={warnings}
      />
    </div>
  );
}
