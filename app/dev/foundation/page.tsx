import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AISuggestion } from "@/components/foundation/AISuggestion";
import { AlertBlock } from "@/components/foundation/AlertBlock";
import { Button } from "@/components/foundation/Button";
import { Card } from "@/components/foundation/Card";
import { DropZone } from "@/components/foundation/DropZone";
import { FieldBlock } from "@/components/foundation/FieldBlock";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import type { IntegrationAuditMap } from "@/lib/foundation/types";
import "@/lib/foundation/tokens.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Foundation Sandbox | Sunbeat",
  robots: {
    index: false,
    follow: false,
  },
};

const auditMap = {
  airtable: {
    key: "airtable",
    label: "Airtable",
    status: "queued",
    blocking: "human_required",
    owner: "human",
    evidence: "Mock audit only; no sync target is called.",
    notes: ["Requires human approval before irreversible sync."],
  },
  google_drive: {
    key: "google_drive",
    label: "Google Drive",
    status: "not_synced",
    blocking: "none",
    owner: "system",
    evidence: "Mock file manifest displayed from local constants.",
  },
  email: {
    key: "email",
    label: "Email",
    status: "not_configured",
    blocking: "none",
    owner: "system",
    evidence: "No Resend route, backend route, or fetch is imported.",
  },
  ai_validation: {
    key: "ai_validation",
    label: "AI validation",
    status: "synced",
    blocking: "soft_block",
    owner: "ai",
    evidence: "Static suggestion payload rendered without model calls.",
  },
} satisfies IntegrationAuditMap;

const auditItems = Object.values(auditMap);

export default function FoundationSandboxPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="sbf-root">
      <div className="sbf-foundation-shell">
        <header className="sbf-foundation-header">
          <div>
            <p className="sbf-eyebrow">Internal dev sandbox</p>
            <h1 className="sbf-foundation-title">
              Sunbeat foundation for protected workflow redesigns
            </h1>
            <p className="sbf-foundation-lede">
              Isolated visual and semantic primitives for future workflow UI.
              This page uses static mocks only and is unavailable in production.
            </p>
          </div>
          <div className="sbf-inline" aria-label="Sandbox guardrails">
            <StatusBadge status="not_synced" label="No API calls" />
            <StatusBadge status="blocked" label="No runtime publish" />
            <StatusBadge status="valid" label="Mock data" />
          </div>
        </header>

        <section className="sbf-grid" aria-label="Foundation components">
          <div className="sbf-col-7">
            <Card
              eyebrow="Form structure"
              title="FieldBlock, status and human approval"
              description="Generic primitives for validation and review states."
              actions={<StatusBadge status="ready_for_review" />}
            >
              <div className="sbf-stack">
                <FieldBlock
                  label="Release identifier"
                  required
                  helperText="A neutral demo field with a mocked validation state."
                  state="valid"
                >
                  <div className="sbf-input-surface">SBF-DEMO-042</div>
                </FieldBlock>
                <FieldBlock
                  label="Commercial clearance"
                  helperText="AI can flag missing context, but cannot approve or publish."
                  message="Human review is required before this can move to sync."
                  messageTone="warn"
                  state="warning"
                  blocking="human_required"
                  statusLabel="Human required"
                >
                  <div className="sbf-input-surface">
                    Mock review note with no submit handler attached.
                  </div>
                </FieldBlock>
              </div>
            </Card>
          </div>

          <div className="sbf-col-5">
            <Card
              eyebrow="AI signals"
              title="AISuggestion"
              tone="ai"
              description="Suggestion and validation display without live model calls."
            >
              <AISuggestion
                title="Missing ownership context"
                summary="The mock payload has enough metadata for a suggestion, but not enough authority for an irreversible action."
                recommendation="Ask a human operator to confirm rights ownership before any publish, sync or rollback step."
                confidence={0.82}
                blocking="soft_block"
                allowedActions={["suggest", "validate", "draft_diff"]}
                actions={
                  <>
                    <Button variant="secondary" size="sm">
                      Review
                    </Button>
                    <Button variant="ghost" size="sm">
                      Dismiss
                    </Button>
                  </>
                }
              />
            </Card>
          </div>

          <div className="sbf-col-4">
            <Card title="AlertBlock" description="Tone examples." density="compact">
              <div className="sbf-stack-tight">
                <AlertBlock title="AI can suggest" tone="ai">
                  <p>Signals are advisory and reversible in this foundation.</p>
                </AlertBlock>
                <AlertBlock title="Human gate" tone="warn" blocking="human_required">
                  <p>Irreversible actions stay blocked until explicit approval.</p>
                </AlertBlock>
              </div>
            </Card>
          </div>

          <div className="sbf-col-4">
            <Card title="DropZone" description="Mocked file intake surface." density="compact">
              <DropZone
                title="Drop files for review"
                description="Display-only sandbox. No upload endpoint is configured."
                acceptLabel="PDF, WAV, PNG"
                maxSizeLabel="Mock limit: 100 MB"
                status="not_synced"
                statusLabel="Local mock"
                files={[
                  {
                    id: "mock-brief",
                    name: "review-brief.pdf",
                    meta: "312 KB",
                    status: "valid",
                    statusLabel: "Validated",
                  },
                  {
                    id: "mock-audio",
                    name: "reference-audio.wav",
                    meta: "18 MB",
                    status: "queued",
                    statusLabel: "Queued",
                  },
                ]}
              />
            </Card>
          </div>

          <div className="sbf-col-4">
            <Card title="Button" description="Command surfaces stay inert here." density="compact">
              <div className="sbf-stack-tight">
                <Button variant="primary" fullWidth>
                  Primary action
                </Button>
                <Button variant="secondary" fullWidth>
                  Secondary action
                </Button>
                <Button variant="danger" fullWidth disabled>
                  Publish blocked
                </Button>
              </div>
            </Card>
          </div>

          <div className="sbf-col-12">
            <section
              className="sbf-section-band"
              aria-labelledby="foundation-audit-title"
            >
              <div className="sbf-section-header">
                <div>
                  <p className="sbf-eyebrow">Integration audit map</p>
                  <h2 className="sbf-section-title" id="foundation-audit-title">
                    Mocked sync and audit statuses
                  </h2>
                  <p className="sbf-section-description">
                    Static map proving the foundation can represent integration
                    readiness without calling Airtable, Drive, email, storage or
                    backend APIs.
                  </p>
                </div>
                <StatusBadge status="not_synced" label="Static audit" />
              </div>
              <div className="sbf-grid">
                {auditItems.map((item) => (
                  <div className="sbf-col-6" key={item.key}>
                    <article className="sbf-audit-item">
                      <div className="sbf-field-header">
                        <div>
                          <h3 className="sbf-audit-item-title">{item.label}</h3>
                          {item.evidence ? (
                            <p className="sbf-audit-item-description">
                              {item.evidence}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="sbf-inline">
                        <StatusBadge
                          status={item.blocking === "none" ? "valid" : "blocked"}
                          label={item.blocking.replace(/_/g, " ")}
                          tone={item.blocking === "none" ? "success" : "warn"}
                          size="sm"
                        />
                        <StatusBadge
                          status="neutral"
                          label={`Owner: ${item.owner ?? "system"}`}
                          size="sm"
                        />
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
