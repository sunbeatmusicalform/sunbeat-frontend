import type { HTMLAttributes, ReactNode } from "react";
import type { AISignalTone } from "@/lib/foundation/types";

type CardTone = AISignalTone | "neutral";
type CardDensity = "regular" | "compact";

export type CardProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  tone?: CardTone;
  density?: CardDensity;
  as?: "article" | "section" | "div";
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  actions,
  as: Element = "section",
  children,
  className,
  density = "regular",
  description,
  eyebrow,
  footer,
  title,
  tone = "neutral",
  ...props
}: CardProps) {
  const hasHeader = Boolean(title || eyebrow || description || actions);

  return (
    <Element
      className={cx("sbf-card", className)}
      data-density={density}
      data-tone={tone}
      {...props}
    >
      <div className="sbf-card-body">
        {hasHeader ? (
          <div className="sbf-card-header">
            <div>
              {eyebrow ? <p className="sbf-eyebrow">{eyebrow}</p> : null}
              {title ? <h2 className="sbf-card-title">{title}</h2> : null}
              {description ? (
                <p className="sbf-card-description">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="sbf-inline">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
      {footer ? <div className="sbf-card-footer">{footer}</div> : null}
    </Element>
  );
}
