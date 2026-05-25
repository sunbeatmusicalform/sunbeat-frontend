import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/foundation/Card";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import "@/lib/foundation/tokens.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schema Renderer Dev Preview | Sunbeat",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SchemaRendererDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="sbf-root">
      <div className="sbf-foundation-shell">
        <header className="sbf-foundation-header">
          <div>
            <p className="sbf-eyebrow">Internal dev preview</p>
            <h1 className="sbf-foundation-title">Form Schema Engine v0</h1>
            <p className="sbf-foundation-lede">
              Isolated schema renderer previews using mock data only. These routes are unavailable in production.
            </p>
          </div>
          <div className="sbf-inline">
            <StatusBadge status="not_synced" label="No API calls" />
            <StatusBadge status="blocked" label="No runtime binding" />
            <StatusBadge status="valid" label="Mock only" />
          </div>
        </header>

        <section className="sbf-grid">
          <div className="sbf-col-7">
            <Card
              description="Four-step release intake candidate rendered from lib/form-schema/release-intake.schema.ts."
              eyebrow="Release intake"
              title="Schema-driven preview"
            >
              <div className="sbf-stack-tight">
                <p className="sbf-card-description">
                  The preview keeps submit, draft, upload, AI, Airtable, Drive and email disconnected.
                </p>
                <Link className="sbf-button" data-variant="primary" href="/dev/schema-renderer/release-intake">
                  Open release intake preview
                </Link>
              </div>
            </Card>
          </div>

          <div className="sbf-col-5">
            <Card
              description="The active Atabaque runtime, workflow registry and renderers are not imported here."
              eyebrow="Guardrails"
              title="Runtime remains untouched"
              tone="warn"
            >
              <div className="sbf-inline">
                <StatusBadge status="blocked" label="No submit" size="sm" />
                <StatusBadge status="blocked" label="No upload" size="sm" />
                <StatusBadge status="blocked" label="No registry change" size="sm" />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

