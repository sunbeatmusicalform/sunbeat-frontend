import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { SyncStatus, ValidationState } from "@/lib/foundation/types";
import { StatusBadge } from "./StatusBadge";

type DropZoneFileStatus = SyncStatus | ValidationState;

export type DropZoneFile = {
  id: string;
  name: string;
  meta?: string;
  status?: DropZoneFileStatus;
  statusLabel?: string;
};

export type DropZoneProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  acceptLabel?: string;
  maxSizeLabel?: string;
  disabled?: boolean;
  files?: DropZoneFile[];
  status?: DropZoneFileStatus;
  statusLabel?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DropZone({
  acceptLabel,
  className,
  description,
  disabled = false,
  files = [],
  inputProps,
  maxSizeLabel,
  status,
  statusLabel,
  title,
  ...props
}: DropZoneProps) {
  const inputClassName = cx("sbf-dropzone-input", inputProps?.className);
  const targetContent = (
    <span>
      <span className="sbf-dropzone-title">{title}</span>
      {description ? (
        <span className="sbf-dropzone-description">{description}</span>
      ) : null}
      {acceptLabel || maxSizeLabel ? (
        <span className="sbf-ai-meta">
          {acceptLabel ? <span>{acceptLabel}</span> : null}
          {maxSizeLabel ? <span>{maxSizeLabel}</span> : null}
        </span>
      ) : null}
    </span>
  );

  return (
    <div className={cx("sbf-dropzone", className)} {...props}>
      {inputProps ? (
        <label className="sbf-dropzone-target" data-disabled={disabled}>
          <input
            {...inputProps}
            className={inputClassName}
            disabled={disabled || inputProps.disabled}
            type={inputProps.type ?? "file"}
          />
          {targetContent}
        </label>
      ) : (
        <div className="sbf-dropzone-target" data-disabled={disabled}>
          {targetContent}
        </div>
      )}
      {status ? (
        <StatusBadge status={status} label={statusLabel} size="sm" />
      ) : null}
      {files.length > 0 ? (
        <ul className="sbf-file-list">
          {files.map((file) => (
            <li className="sbf-file-row" key={file.id}>
              <div>
                <div className="sbf-file-name">{file.name}</div>
                {file.meta ? <div className="sbf-file-meta">{file.meta}</div> : null}
              </div>
              {file.status ? (
                <StatusBadge
                  status={file.status}
                  label={file.statusLabel}
                  size="sm"
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
