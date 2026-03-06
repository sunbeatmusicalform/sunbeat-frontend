import { Suspense } from "react";
import LoginPageClient from "./page-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050816]" />}>
      <LoginPageClient />
    </Suspense>
  );
}