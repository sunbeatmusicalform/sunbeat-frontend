import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
  isLoading?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  icon,
  iconPosition = "start",
  isLoading = false,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cx("sbf-button", className)}
      data-full-width={fullWidth}
      data-size={size}
      data-variant={variant}
      disabled={isDisabled}
      type={type}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {icon && iconPosition === "start" ? (
        <span className="sbf-button-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{isLoading ? "Carregando" : children}</span>
      {icon && iconPosition === "end" ? (
        <span className="sbf-button-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </button>
  );
}
