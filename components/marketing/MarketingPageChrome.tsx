import Navbar from "./Navbar";
import Footer from "./Footer";
import type { Market } from "@/lib/billing/catalog";

export default function MarketingPageChrome({
  market,
  children,
}: {
  market: Market;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer market={market} />
    </>
  );
}
