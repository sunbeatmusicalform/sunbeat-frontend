import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sunbeat.pro",
      lastModified: new Date()
    },
    {
      url: "https://sunbeat.pro/product",
      lastModified: new Date()
    },
    {
      url: "https://sunbeat.pro/pricing",
      lastModified: new Date()
    }
  ];
}