"use client";

// app/people/[workspaceSlug]/page.tsx
// Rota pública do formulário de cadastro de pessoas
// Ex: /people/atabaque → formulário Atabaque People Registry
//
// GUARDRAIL: não altera /intake/[workspaceSlug] nem release_intake

import { useParams } from "next/navigation";
import PeopleRegistryForm from "@/components/people-registry/PeopleRegistryForm";
import { getPeopleRegistryProfile } from "@/lib/people-registry/profile-registry";

export default function PeopleRegistryPage() {
  const params = useParams();

  const workspaceSlug =
    typeof params.workspaceSlug === "string"
      ? params.workspaceSlug
      : Array.isArray(params.workspaceSlug)
      ? params.workspaceSlug[0]
      : "";

  const profile = getPeopleRegistryProfile(workspaceSlug);

  if (!profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          gap: "0.75rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted-2)",
          }}
        >
          People Registry
        </p>
        <h1
          style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}
        >
          Workspace não encontrado
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", maxWidth: "360px" }}>
          O formulário de cadastro não está disponível para este endereço.
          Verifique o link ou contate o time responsável.
        </p>
        <code
          style={{
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            color: "var(--muted-2)",
            background: "rgba(255,255,255,0.06)",
            padding: "0.25rem 0.75rem",
            borderRadius: "0.375rem",
          }}
        >
          {workspaceSlug || "(sem slug)"}
        </code>
      </div>
    );
  }

  return <PeopleRegistryForm profile={profile} />;
}
