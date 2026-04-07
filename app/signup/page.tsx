import { Suspense } from "react";
import SignupPageClient from "./page-client";

export const metadata = {
  title: "Criar conta — Sunbeat",
  description: "Crie seu workspace na Sunbeat e comece a receber lançamentos de forma organizada.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageClient />
    </Suspense>
  );
}
