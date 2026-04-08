"use client";

import { useState } from "react";
import type { Market } from "@/lib/billing/catalog";

export function UpgradeButton({
  planId,
  workspaceSlug,
  market = "global",
  style,
  className,
  children,
}: {
  planId: string;
  workspaceSlug: string;
  market?: Market;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, workspace_slug: workspaceSlug, market }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao iniciar checkout. Tente novamente.");
        setLoading(false);
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? "Aguarde..." : (children ?? "Fazer upgrade")}
    </button>
  );
}

export function ManageSubscriptionButton({
  workspaceSlug,
  style,
  className,
  children,
}: {
  workspaceSlug: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_slug: workspaceSlug }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao abrir portal de assinatura. Tente novamente.");
        setLoading(false);
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? "Aguarde..." : (children ?? "Gerenciar assinatura")}
    </button>
  );
}
