import type { ChangeEvent, CSSProperties, ReactNode } from "react";

import { AISuggestion } from "@/components/foundation/AISuggestion";
import { Button } from "@/components/foundation/Button";
import { DropZone, type DropZoneFile } from "@/components/foundation/DropZone";
import { FieldBlock } from "@/components/foundation/FieldBlock";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import type {
  AISignalSpec,
  FormField,
  SchemaValue,
  SchemaValueMap,
} from "@/lib/form-schema/types";

type SchemaFieldRendererProps = {
  field: FormField;
  mode: "preview" | "readonly" | "runtime_candidate";
  onJumpToStep?: (stepId: string) => void;
  onValueChange: (key: string, value: SchemaValue) => void;
  value: SchemaValue | undefined;
};

const controlStyle: CSSProperties = {
  background: "var(--sbf-color-page-strong)",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  color: "var(--sbf-color-ink)",
  font: "inherit",
  minHeight: 42,
  padding: "0.65rem 0.75rem",
  width: "100%",
};

const textareaStyle: CSSProperties = {
  ...controlStyle,
  minHeight: 118,
  resize: "vertical",
};

const checkboxShellStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--sbf-color-page-strong)",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  display: "flex",
  gap: "var(--sbf-space-3)",
  minHeight: 48,
  padding: "var(--sbf-space-3)",
};

const repeaterRowStyle: CSSProperties = {
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  display: "grid",
  gap: "var(--sbf-space-3)",
  padding: "var(--sbf-space-4)",
};

const repeaterHeaderStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  gap: "var(--sbf-space-3)",
  justifyContent: "space-between",
};

const specGridStyle: CSSProperties = {
  display: "grid",
  gap: "var(--sbf-space-3)",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  marginTop: "var(--sbf-space-3)",
};

const specTileStyle: CSSProperties = {
  background: "var(--sbf-color-page-strong)",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  display: "grid",
  gap: "var(--sbf-space-2)",
  padding: "var(--sbf-space-3)",
};

const matchCardStyle: CSSProperties = {
  alignItems: "center",
  background: "rgba(255, 255, 255, 0.7)",
  border: "1px solid var(--sbf-color-line)",
  borderRadius: "var(--sbf-radius-sm)",
  display: "flex",
  gap: "var(--sbf-space-3)",
  padding: "var(--sbf-space-3)",
};

const avatarStyle: CSSProperties = {
  alignItems: "center",
  background: "linear-gradient(135deg, #fbbf24, #ef5f3c)",
  borderRadius: 999,
  color: "#111111",
  display: "inline-flex",
  fontSize: "0.75rem",
  fontWeight: 800,
  height: 32,
  justifyContent: "center",
  width: 32,
};

function scalarToString(value: SchemaValue | undefined) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
}

function valueToBoolean(value: SchemaValue | undefined) {
  return typeof value === "boolean" ? value : false;
}

function valueToRows(value: SchemaValue | undefined): SchemaValueMap[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is SchemaValueMap =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}

function valueToDropZoneFiles(value: SchemaValue | undefined): DropZoneFile[] {
  if (Array.isArray(value)) {
    return valueToRows(value).map((item, index) => ({
      id: scalarToString(item.id) || `file-${index}`,
      name: scalarToString(item.name) || `Mock file ${index + 1}`,
      meta: scalarToString(item.meta),
      status: scalarToString(item.status) as DropZoneFile["status"],
      statusLabel: scalarToString(item.statusLabel),
    }));
  }

  if (typeof value === "object" && value !== null) {
    const item = value as SchemaValueMap;
    return [
      {
        id: scalarToString(item.id) || "mock-file",
        name: scalarToString(item.name) || "Mock file",
        meta: scalarToString(item.meta),
        status: scalarToString(item.status) as DropZoneFile["status"],
        statusLabel: scalarToString(item.statusLabel),
      },
    ];
  }

  return [];
}

function getTrackValidation(row: SchemaValueMap, key: "ok" | "warn" | "err") {
  const validations = row.validations;

  if (
    typeof validations !== "object" ||
    validations === null ||
    Array.isArray(validations)
  ) {
    return [];
  }

  const items = (validations as SchemaValueMap)[key];

  return Array.isArray(items)
    ? items.filter((item): item is string => typeof item === "string")
    : [];
}

function renderSignalActions(
  signal: AISignalSpec,
  onJumpToStep?: (stepId: string) => void,
) {
  if (!signal.actions?.length) {
    return null;
  }

  return (
    <>
      {signal.actions.map((action) => (
        <Button
          disabled={action.kind === "disabled_preview" || !action.targetStepId}
          key={`${signal.id}-${action.label}`}
          onClick={() => {
            if (action.kind === "jump" && action.targetStepId) {
              onJumpToStep?.(action.targetStepId);
            }
          }}
          size="sm"
          variant={action.kind === "primary" || action.kind === "jump" ? "primary" : "secondary"}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}

function renderSignal(signal: AISignalSpec, onJumpToStep?: (stepId: string) => void) {
  const match = signal.match ? (
    <div style={matchCardStyle}>
      <span aria-hidden="true" style={avatarStyle}>
        {signal.match.initials ?? "AI"}
      </span>
      <span className="sbf-stack-tight">
        <strong>{signal.match.title}</strong>
        {signal.match.subtitle ? <span>{signal.match.subtitle}</span> : null}
      </span>
    </div>
  ) : null;

  return (
    <AISuggestion
      actions={renderSignalActions(signal, onJumpToStep)}
      allowedActions={signal.allowedActions}
      blocking={signal.blocking ?? "none"}
      confidence={signal.confidence}
      key={signal.id}
      recommendation={match ?? signal.recommendation}
      requiresHumanApproval={signal.requiresHumanApproval ?? true}
      summary={signal.summary}
      title={signal.title}
      tone={signal.tone}
      validationState={signal.validationState ?? "pending"}
    />
  );
}

function renderRepeaterRow(row: SchemaValueMap, index: number) {
  const err = getTrackValidation(row, "err");
  const warn = getTrackValidation(row, "warn");
  const ok = getTrackValidation(row, "ok");
  const hasBlocker = err.length > 0;
  const hasWarning = warn.length > 0;

  return (
    <div key={scalarToString(row.id) || index} style={repeaterRowStyle}>
      <div style={repeaterHeaderStyle}>
        <div className="sbf-stack-tight">
          <span className="sbf-eyebrow">Faixa {scalarToString(row.order) || index + 1}</span>
          <strong>{scalarToString(row.title) || "Untitled track"}</strong>
          <span className="sbf-ai-meta">
            <span>{scalarToString(row.duration) || "--:--"}</span>
            <span>{scalarToString(row.isrc_code) || "ISRC a cunhar"}</span>
            <span>{scalarToString(row.audio_file) || "Audio pendente"}</span>
          </span>
        </div>
        <StatusBadge
          status={hasBlocker ? "blocked" : hasWarning ? "warning" : "valid"}
          label={hasBlocker ? "Bloqueio" : hasWarning ? "Aviso" : "OK"}
          size="sm"
        />
      </div>
      <div className="sbf-inline">
        <StatusBadge
          status={err.includes("isrc_duplicate") ? "blocked" : scalarToString(row.isrc_code) ? "valid" : "warning"}
          label={err.includes("isrc_duplicate") ? "ISRC dup" : scalarToString(row.isrc_code) ? "ISRC OK" : "ISRC a cunhar"}
          size="sm"
        />
        <StatusBadge
          status={ok.includes("audio_lufs") ? "valid" : "warning"}
          label={ok.includes("audio_lufs") ? "Audio OK" : "Audio pendente"}
          size="sm"
        />
        <StatusBadge
          status={ok.includes("credits_present") ? "valid" : "warning"}
          label={ok.includes("credits_present") ? "Creditos OK" : "Creditos a revisar"}
          size="sm"
        />
      </div>
      <div className="sbf-stack-tight">
        <span className="sbf-eyebrow">Autores</span>
        <span>{scalarToString(row.authors) || "Nao informado"}</span>
      </div>
    </div>
  );
}

function renderFieldControl({
  field,
  mode,
  onValueChange,
  value,
}: SchemaFieldRendererProps) {
  const disabled = mode !== "preview";

  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onValueChange(field.key, event.target.value)
          }
          placeholder={field.placeholder}
          style={textareaStyle}
          value={scalarToString(value)}
        />
      );

    case "select":
      return (
        <select
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onValueChange(field.key, event.target.value)
          }
          style={controlStyle}
          value={scalarToString(value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "date":
      return (
        <input
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onValueChange(field.key, event.target.value)
          }
          style={controlStyle}
          type="date"
          value={scalarToString(value)}
        />
      );

    case "boolean":
      return (
        <label style={checkboxShellStyle}>
          <input
            checked={valueToBoolean(value)}
            disabled={disabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange(field.key, event.target.checked)
            }
            type="checkbox"
          />
          <span>{valueToBoolean(value) ? "Sim" : "Nao"}</span>
        </label>
      );

    case "repeater":
      return (
        <div className="sbf-stack-tight">
          {valueToRows(value).map((row, index) => renderRepeaterRow(row, index))}
        </div>
      );

    case "upload":
      return (
        <div className="sbf-stack-tight">
          <DropZone
            acceptLabel={field.uploadSpec?.acceptLabel}
            description="Display-only placeholder. No file input is attached."
            files={valueToDropZoneFiles(value)}
            maxSizeLabel={field.uploadSpec?.maxSizeLabel}
            status={field.validationState}
            statusLabel={field.statusLabel ?? "Mock"}
            title="Upload placeholder"
          />
          {field.uploadSpec?.requiredSpecs ? (
            <div style={specGridStyle}>
              {field.uploadSpec.requiredSpecs.map((spec) => (
                <div key={spec.key} style={specTileStyle}>
                  <span className="sbf-eyebrow">{spec.label}</span>
                  <strong>{spec.value}</strong>
                  <span className="sbf-ai-meta">{spec.required}</span>
                  <StatusBadge
                    status={spec.tone}
                    label={
                      spec.tone === "danger"
                        ? "Bloqueio"
                        : spec.tone === "warn"
                          ? "Aviso"
                          : "OK"
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );

    case "review":
      return (
        <div className="sbf-input-surface">
          Review is generated from the schema summary below.
        </div>
      );

    case "text":
    default:
      return (
        <input
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onValueChange(field.key, event.target.value)
          }
          placeholder={field.placeholder}
          style={controlStyle}
          type="text"
          value={scalarToString(value)}
        />
      );
  }
}

function getFieldMessage(field: FormField): {
  message?: ReactNode;
  messageTone?: "warn" | "danger";
} {
  if (field.blocking && field.blocking !== "none") {
    return {
      message: field.validation?.[0]?.message ?? "This field has a blocking validation signal.",
      messageTone: "danger",
    };
  }

  if (field.validationState === "warning") {
    return {
      message: field.validation?.[0]?.message ?? "Review recommended before runtime binding.",
      messageTone: "warn",
    };
  }

  return {};
}

export function SchemaFieldRenderer(props: SchemaFieldRendererProps) {
  const { field, onJumpToStep } = props;
  const fieldMessage = getFieldMessage(field);

  return (
    <div className="sbf-stack-tight">
      <FieldBlock
        blocking={field.blocking ?? "none"}
        helperText={field.helperText}
        label={field.label}
        message={fieldMessage.message}
        messageTone={fieldMessage.messageTone}
        required={field.required}
        state={field.validationState ?? "idle"}
        statusLabel={field.statusLabel}
      >
        {renderFieldControl(props)}
      </FieldBlock>
      {field.aiSignals?.map((signal) => renderSignal(signal, onJumpToStep))}
    </div>
  );
}

