import type { HTMLAttributes, ReactNode } from "react";
import type {
  AISignalTone,
  BlockingState,
  ValidationState,
} from "@/lib/foundation/types";
import { StatusBadge } from "./StatusBadge";

export type AISuggestionProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  summary: ReactNode;
  recommendation?: ReactNode;
  tone?: AISignalTone;
  confidence?: number;
  blocking?: BlockingState;
  validationState?: ValidationState;
  allowedActions?: string[];
  requiresHumanApproval?: boolean;
  actions?: ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatConfidence(confidence?: number) {
  if (typeof confidence !== "number") {
    return null;
  }

  return `${Math.round(Math.max(0, Math.min(confidence, 1)) * 100)}%`;
}

export function AISuggestion({
  actions,
  allowedActions = ["suggest", "validate"],
  blocking = "none",
  className,
  confidence,
  recommendation,
  requiresHumanApproval = true,
  summary,
  title,
  tone = "ai",
  validationState = "pending",
  ...props
}: AISuggestionProps) {
  const confidenceLabel = formatConfidence(confidence);

  return (
    <div
      className={cx("sbf-ai-suggestion", className)}
      data-blocking={blocking}
      data-tone={tone}
      {...props}
    >
      <div className="sbf-ai-header">
        <div className="sbf-inline">
          <StatusBadge status={tone} label="AI signal" />
          <StatusBadge status={validationState} size="sm" />
        </div>
        {requiresHumanApproval ? (
          <StatusBadge
            status="blocked"
            label="Aprovacao humana"
            tone="warn"
            size="sm"
          />
        ) : null}
      </div>
      <div className="sbf-stack-tight">
        <h3 className="sbf-ai-title">{title}</h3>
        <p className="sbf-ai-summary">{summary}</p>
        {recommendation ? (
          <p className="sbf-ai-recommendation">{recommendation}</p>
        ) : null}
      </div>
      <div className="sbf-ai-meta">
        {confidenceLabel ? <span>Confianca: {confidenceLabel}</span> : null}
        <span>Acoes: {allowedActions.join(", ")}</span>
        <span>Bloqueio: {blocking.replace(/_/g, " ")}</span>
      </div>
      {actions ? <div className="sbf-inline">{actions}</div> : null}
    </div>
  );
}
