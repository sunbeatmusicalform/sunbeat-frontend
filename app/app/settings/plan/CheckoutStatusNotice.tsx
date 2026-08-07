"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ConfirmationState = "confirming" | "confirmed" | "error";

export default function CheckoutStatusNotice({
  checkoutStatus,
  sessionId,
  workspaceSlug,
  isBrazil,
}: {
  checkoutStatus: "success" | "cancelled";
  sessionId: string | null;
  workspaceSlug: string;
  isBrazil: boolean;
}) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<ConfirmationState>(
    checkoutStatus === "success"
      ? sessionId
        ? "confirming"
        : "error"
      : "confirmed"
  );

  useEffect(() => {
    if (checkoutStatus !== "success" || !sessionId || started.current) return;
    started.current = true;

    async function confirmCheckout() {
      try {
        const response = await fetch("/api/billing/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            workspace_slug: workspaceSlug,
          }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          setState("error");
          return;
        }

        setState("confirmed");
        router.refresh();
      } catch {
        setState("error");
      }
    }

    void confirmCheckout();
  }, [checkoutStatus, router, sessionId, workspaceSlug]);

  if (checkoutStatus === "cancelled") {
    return (
      <div
        role="status"
        className="mb-8 rounded-[20px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-900"
      >
        <p className="font-semibold">
          {isBrazil ? "Checkout cancelado" : "Checkout cancelled"}
        </p>
        <p className="mt-1 leading-6">
          {isBrazil
            ? "Nenhuma cobrança foi feita. Seu plano atual continua ativo."
            : "You were not charged. Your current plan remains active."}
        </p>
      </div>
    );
  }

  const isConfirmed = state === "confirmed";
  const isError = state === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-8 rounded-[20px] border px-6 py-5 text-sm ${
        isError
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <p className="font-semibold">
        {isConfirmed
          ? isBrazil
            ? "Assinatura ativada"
            : "Subscription activated"
          : isError
            ? isBrazil
              ? "Não foi possível confirmar automaticamente"
              : "Automatic confirmation is pending"
            : isBrazil
              ? "Confirmando sua assinatura…"
              : "Confirming your subscription…"}
      </p>
      <p className="mt-1 leading-6">
        {isConfirmed
          ? isBrazil
            ? "Seu novo plano já está disponível neste workspace."
            : "Your new plan is now available in this workspace."
          : isError
            ? isBrazil
              ? "Se o pagamento foi concluído, atualize esta página em instantes. A reconciliação automática também concluirá a ativação."
              : "If payment completed, refresh this page shortly. Automatic reconciliation will also complete activation."
            : isBrazil
              ? "Isso normalmente leva apenas alguns segundos."
              : "This normally takes only a few seconds."}
      </p>
    </div>
  );
}
