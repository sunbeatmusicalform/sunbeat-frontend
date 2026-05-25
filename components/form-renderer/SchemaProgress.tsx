import type { CSSProperties } from "react";

import type { FormStep } from "@/lib/form-schema/types";

type SchemaProgressProps = {
  steps: FormStep[];
  activeStepId: string;
  onStepChange: (stepId: string) => void;
};

const progressShellStyle: CSSProperties = {
  background: "var(--sbf-color-panel-solid)",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-md)",
  boxShadow: "var(--sbf-shadow-card)",
  display: "grid",
  gap: "var(--sbf-space-3)",
  padding: "var(--sbf-space-4)",
};

const progressGridStyle: CSSProperties = {
  display: "grid",
  gap: "var(--sbf-space-3)",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
};

const stepButtonStyle: CSSProperties = {
  alignItems: "flex-start",
  background: "var(--sbf-color-page-strong)",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  color: "var(--sbf-color-ink)",
  cursor: "pointer",
  display: "grid",
  gap: "var(--sbf-space-2)",
  minHeight: 86,
  padding: "var(--sbf-space-3)",
  textAlign: "left",
};

const stepButtonActiveStyle: CSSProperties = {
  borderColor: "rgba(49, 94, 251, 0.34)",
  boxShadow: "0 0 0 3px rgba(49, 94, 251, 0.12)",
};

const stepNumberStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: 999,
  display: "inline-flex",
  fontSize: "0.75rem",
  fontWeight: 800,
  height: 24,
  justifyContent: "center",
  width: 24,
};

const stepTitleStyle: CSSProperties = {
  fontSize: "0.9375rem",
  fontWeight: 750,
  lineHeight: 1.2,
  margin: 0,
};

const stepMetaStyle: CSSProperties = {
  color: "var(--sbf-color-muted)",
  fontSize: "0.75rem",
  margin: 0,
};

export function SchemaProgress({
  activeStepId,
  onStepChange,
  steps,
}: SchemaProgressProps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStepId);

  return (
    <nav aria-label="Schema renderer steps" style={progressShellStyle}>
      <div className="sbf-inline">
        <span className="sbf-eyebrow">Wizard</span>
        <span className="sbf-ai-meta">
          Step {Math.max(activeIndex, 0) + 1} of {steps.length}
        </span>
      </div>
      <div style={progressGridStyle}>
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const isDone = activeIndex > index;
          const numberTone = isActive ? "ai" : isDone ? "success" : "neutral";

          return (
            <button
              aria-current={isActive ? "step" : undefined}
              key={step.id}
              onClick={() => onStepChange(step.id)}
              style={{
                ...stepButtonStyle,
                ...(isActive ? stepButtonActiveStyle : {}),
              }}
              type="button"
            >
              <span
                className="sbf-status-badge"
                data-size="sm"
                data-tone={numberTone}
                style={stepNumberStyle}
              >
                {index + 1}
              </span>
              <span>
                <span style={stepTitleStyle}>{step.label}</span>
                <span style={stepMetaStyle}>{isDone ? "Done" : isActive ? "Active" : "Todo"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
