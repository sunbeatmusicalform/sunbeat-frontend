"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function LogoutButton() {
  const supabase = createSupabaseBrowser();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-white/20 px-4 py-2 text-sm"
    >
      Sair
    </button>
  );
}