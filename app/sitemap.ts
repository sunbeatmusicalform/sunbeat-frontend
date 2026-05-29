import { MetadataRoute } from "next";

const BASE = "https://sunbeat.pro";

const PUBLIC_ROUTES = [
  "/",
  "/product",
  "/pricing",
  "/how-it-works",
  "/airtable-music-workflow",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
  "/security",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
  }));
}
