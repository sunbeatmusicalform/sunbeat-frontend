import type {
  AISignalTone,
  SubmissionStatus,
  SyncStatus,
  ValidationState,
} from "@/lib/foundation/types";

export type StatusBadgeTone = AISignalTone | "neutral";

export type StatusBadgeStatus =
  | AISignalTone
  | SubmissionStatus
  | SyncStatus
  | ValidationState
  | "neutral";

type StatusBadgeProps = {
  status: StatusBadgeStatus;
  label?: string;
  tone?: StatusBadgeTone;
  size?: "sm" | "md";
  className?: string;
};

const STATUS_TONES: Partial<Record<StatusBadgeStatus, StatusBadgeTone>> = {
  ai: "ai",
  warn: "warn",
  warning: "warn",
  danger: "danger",
  invalid: "danger",
  blocked: "danger",
  failed: "danger",
  success: "success",
  valid: "success",
  submitted: "success",
  synced: "success",
  pending: "ai",
  syncing: "ai",
  queued: "ai",
  ready_for_review: "ai",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusBadge({
  status,
  label,
  tone,
  size = "md",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cx("sbf-status-badge", className)}
      data-size={size}
      data-tone={tone ?? STATUS_TONES[status] ?? "neutral"}
    >
      {label ?? humanize(status)}
    </span>
  );
}
