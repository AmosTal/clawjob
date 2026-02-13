import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/employer/"],
    },
    sitemap: "https://clawjob-yb6z4mnc2q-uc.a.run.app/sitemap.xml",
  };
}
