import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingHome from "@/components/marketing/MarketingHome";

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  return <MarketingHome market={market} />;
}
