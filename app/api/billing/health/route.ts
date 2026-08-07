import { NextResponse } from "next/server";

import {
  getBillingConfigurationStatus,
  hasBillingEventStore,
} from "@/lib/billing/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const [eventStore, global, brazil] = await Promise.all([
    hasBillingEventStore(),
    Promise.resolve(getBillingConfigurationStatus("global")),
    Promise.resolve(getBillingConfigurationStatus("brazil")),
  ]);
  const ready = eventStore && global.ready && brazil.ready;

  return NextResponse.json(
    {
      ok: ready,
      service: "sunbeat-billing",
      checks: {
        eventStore,
        global: global.ready,
        brazil: brazil.ready,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
