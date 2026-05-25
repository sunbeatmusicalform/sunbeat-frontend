import type { HTMLAttributes, ReactNode } from "react";
import type { AISignalTone, BlockingState } from "@/lib/foundation/types";

export type AlertBlockProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  tone?: AISignalTone;
  icon?: ReactNode;
  actions?: ReactNode;
  blocking?: BlockingState;
};

const TONE_LABELS: Record<AISignalTone, string> = {
  ai: "AI",
  warn: "!",
  danger: "!",
  success: "OK",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AlertBlock({
  actions,
  blocking = "none",
  children,
  className,
  icon,
  title,
  tone = "ai",
  ...props
}: AlertBlockProps) {
  return (
    <div
      className={cx("sbf-alert", className)}
      data-blocking={blocking}
      data-tone={tone}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      <div className="sbf-alert-icon" aria-hidden="true">
        {icon ?? TONE_LABELS[tone]}
      </div>
      <div>
        <h3 className="sbf-alert-title">{title}</h3>
        <div className="sbf-alert-content">{children}</div>
        {actions ? <div className="sbf-alert-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
