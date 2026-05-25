import type { CSSProperties } from "react";

import { Button } from "@/components/foundation/Button";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import type { SchemaRendererMode } from "@/lib/form-schema/types";

type SchemaSaveFooterProps = {
  activeStepLabel: string;
  blockers: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  mode: SchemaRendererMode;
  onBack: () => void;
  onNext: () => void;
  warnings: number;
};

const footerStyle: CSSProperties = {
  backdropFilter: "blur(20px)",
  background: "rgba(246, 242, 234, 0.94)",
  borderTop: "1px solid var(--sbf-color-line)",
  bottom: 0,
  position: "sticky",
  zIndex: 10,
};

const footerInnerStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "var(--sbf-space-4)",
  justifyContent: "space-between",
  margin: "0 auto",
  maxWidth: 1180,
  padding: "var(--sbf-space-4) var(--sbf-space-5)",
  width: "min(100%, 1180px)",
};

const footerHintStyle: CSSProperties = {
  color: "var(--sbf-color-muted)",
  fontSize: "0.875rem",
  margin: 0,
};

export function SchemaSaveFooter({
  activeStepLabel,
  blockers,
  canGoBack,
  canGoNext,
  isLastStep,
  mode,
  onBack,
  onNext,
  warnings,
}: SchemaSaveFooterProps) {
  return (
    <footer style={footerStyle}>
      <div style={footerInnerStyle}>
        <div className="sbf-stack-tight">
          <div className="sbf-inline">
            <StatusBadge status="not_synced" label="Local state only" size="sm" />
            <StatusBadge status="blocked" label="Submit preview blocked" size="sm" />
            {blockers > 0 ? (
              <StatusBadge status="blocked" label={`${blockers} blockers`} size="sm" />
            ) : null}
            {warnings > 0 ? (
              <StatusBadge status="warning" label={`${warnings} warnings`} size="sm" />
            ) : null}
          </div>
          <p style={footerHintStyle}>
            {activeStepLabel} runs in {mode} mode. No draft, upload, sync or email endpoint is connected.
          </p>
        </div>
        <div className="sbf-inline">
          <Button disabled={!canGoBack} onClick={onBack} variant="ghost">
            Back
          </Button>
          {isLastStep ? (
            <Button disabled variant={blockers > 0 ? "danger" : "primary"}>
              Submit blocked in preview
            </Button>
          ) : (
            <Button disabled={!canGoNext} onClick={onNext} variant="primary">
              Continue
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}

