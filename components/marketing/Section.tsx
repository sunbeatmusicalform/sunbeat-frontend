import type { ReactNode } from "react";

export default function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9B948D]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111111] md:text-4xl">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5E5A54] md:text-base">
          {subtitle}
        </p>
      ) : null}

      <div className="mt-10">{children}</div>
    </section>
  );
}