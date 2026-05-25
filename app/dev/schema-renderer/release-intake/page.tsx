import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SchemaFormRenderer } from "@/components/form-renderer/SchemaFormRenderer";
import {
  mockReleaseIntakeSummary,
  mockReleaseIntakeValues,
} from "@/lib/form-schema/mock-release-intake-data";
import { releaseIntakeSchema } from "@/lib/form-schema/release-intake.schema";
import "@/lib/foundation/tokens.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Release Intake Schema Preview | Sunbeat",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReleaseIntakeSchemaPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <SchemaFormRenderer
      initialValues={mockReleaseIntakeValues}
      mode="preview"
      schema={releaseIntakeSchema}
      summary={mockReleaseIntakeSummary}
    />
  );
}

