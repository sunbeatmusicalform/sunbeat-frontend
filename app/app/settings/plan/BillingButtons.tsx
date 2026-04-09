"use client";

import { useEffect, useState } from "react";
import type { Market } from "@/lib/billing/catalog";

export function UpgradeButton({
  planId,
  workspaceSlug,
  market = "global",
  autoCheckout = false,
  style,
  className,
  children,
}: {
  planId: string;
  workspaceSlug: string;
  market?: Market;
  /** When true, triggers checkout automatically on mount (used when arriving from signup with plan_intent). */
  autoCheckout?: boolean;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  const [loading, setLoading] = useState(autoCheckout); // start in loading if auto-triggering

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

  // Auto-trigger checkout on mount when arriving from pricing → signup funnel
  useEffect(() => {
    if (autoCheckout) {
      handleUpgrade();
    }
    // Only run on mount — intentional dependency omission
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
