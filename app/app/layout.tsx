import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 p-4 flex items-center justify-between">
        <Link href="/app" className="font-semibold">
          Sunbeat
        </Link>

        {user ? <LogoutButton /> : null}
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}