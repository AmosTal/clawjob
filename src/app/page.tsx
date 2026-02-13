import HomeClient from "./HomeClient";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "clawjob",
        url: "https://clawjob-yb6z4mnc2q-uc.a.run.app",
        description:
          "Discover and apply to jobs with a simple swipe. clawjob makes job hunting fast, fun, and effective.",
      },
      {
        "@type": "WebApplication",
        name: "clawjob",
        url: "https://clawjob-yb6z4mnc2q-uc.a.run.app",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        description:
          "Swipe your way to your dream job. A modern job search platform.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
