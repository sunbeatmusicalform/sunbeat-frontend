"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function LogoutButton() {
  const supabase = createSupabaseBrowser();

  return (
    <button
      className="rounded-xl border border-white/10 px-4 py-2"
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}
    >
      Sair
    </button>
  );
}