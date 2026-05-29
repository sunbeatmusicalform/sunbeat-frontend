import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/intake/",
          "/clearance/",
          "/people/",
          "/company/",
          "/app/",
          "/auth/",
          "/api/",
          "/dev/",
          "/edit/",
        ],
      },
    ],
    sitemap: "https://sunbeat.pro/sitemap.xml",
  };
}
