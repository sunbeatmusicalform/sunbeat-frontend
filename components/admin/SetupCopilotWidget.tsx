"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

type Message = {
  role: "user" | "assistant" | "error";
  content: string;
};

type Props = {
  workspaceSlug: string;
};

export default function SetupCopilotWidget({ workspaceSlug }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, workspaceSlug }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            content:
              data?.error ??
              "O copilot não está disponível no momento. Verifique se AI_GATEWAY_ENABLED está ativo no backend.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text ?? "" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "Erro de rede. Verifique a conexão e tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Message history */}
      <div
        className={`min-h-[200px] rounded-[24px] border border-white/10 bg-black/20 p-5 ${
          isEmpty ? "flex items-center justify-center" : ""
        }`}
        style={{ maxHeight: "420px", overflowY: "auto" }}
      >
        {isEmpty ? (
          <p className="text-center text-sm text-white/35">
            Faça uma pergunta sobre a configuração do workspace — workflows, branding, integrações, campos do formulário…
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[18px] px-4 py-3 text-sm leading-7 ${
                    msg.role === "user"
                      ? "bg-white/10 text-white"
                      : msg.role === "error"
                        ? "border border-red-400/30 bg-red-400/10 text-red-200"
                        : "border border-white/10 bg-white/[0.04] text-white/85"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <AssistantText content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Como configurar o release intake para meu workspace?  (Enter para enviar, Shift+Enter para nova linha)"
          disabled={loading}
          rows={2}
          className="flex-1 resize-none rounded-[18px] border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="self-end rounded-[18px] border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "…" : "Enviar"}
        </button>
      </div>

      <p className="text-xs text-white/30">
        Setup Copilot · lê a configuração do workspace · não modifica dados
      </p>
    </div>
  );
}

// Render assistant text — preserves newlines, no markdown parser needed
function AssistantText({ content }: { content: string }) {
  return (
    <>
      {content.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          {i < content.split("\n").length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-white/40"
          style={{
            animation: "pulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}
