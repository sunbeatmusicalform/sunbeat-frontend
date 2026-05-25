import type { HTMLAttributes, ReactNode } from "react";
import type { BlockingState, ValidationState } from "@/lib/foundation/types";
import { StatusBadge } from "./StatusBadge";

export type FieldBlockProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  children: ReactNode;
  helperText?: ReactNode;
  message?: ReactNode;
  messageTone?: "warn" | "danger";
  required?: boolean;
  state?: ValidationState;
  blocking?: BlockingState;
  statusLabel?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FieldBlock({
  blocking = "none",
  children,
  className,
  helperText,
  label,
  message,
  messageTone,
  required = false,
  state = "idle",
  statusLabel,
  ...props
}: FieldBlockProps) {
  const shouldShowStatus = state !== "idle" || blocking !== "none";
  const resolvedStatus = blocking !== "none" ? "blocked" : state;

  return (
    <div
      className={cx("sbf-field", className)}
      data-blocking={blocking}
      data-state={state}
      {...props}
    >
      <div className="sbf-field-header">
        <div>
          <p className="sbf-field-label">
            <span>{label}</span>
            {required ? (
              <span className="sbf-field-required" aria-label="obrigatorio">
                *
              </span>
            ) : null}
          </p>
          {helperText ? <p className="sbf-field-helper">{helperText}</p> : null}
        </div>
        {shouldShowStatus ? (
          <StatusBadge
            status={resolvedStatus}
            label={statusLabel}
            size="sm"
          />
        ) : null}
      </div>
      <div className="sbf-field-control">{children}</div>
      {message ? (
        <p className="sbf-field-message" data-tone={messageTone}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
