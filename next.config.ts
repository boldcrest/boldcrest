import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async redirects() {
    return [
      // The Privacy Notice page used to live at /privacy-policy. Permanently
      // redirect the old path so existing/cached links keep resolving.
      {
        source: "/privacy-policy",
        destination: "/privacy-notice",
        permanent: true,
      },
      // The "Start a Project" route was shortened to /start. 301 the old path
      // so any existing/bookmarked links keep resolving.
      {
        source: "/start-a-new-project",
        destination: "/start",
        permanent: true,
      },
      // WordPress→Next migration: a few project slugs were shortened. 301 the
      // old WordPress slug to the new one so Google consolidates the indexed
      // page (and old backlinks keep resolving) instead of hitting a 404.
      // Old trailing-slash URLs are normalised by Next before matching.
      {
        source: "/work/ak-invest-secure-money-transfers-in-the-blink-of-an-eye",
        destination: "/work/ak-invest-fast-secure-transfers",
        permanent: true,
      },
      // Queen Lula project slug shortened (client corrected to Lufra®, tagline
      // "Long Live the Queen" dropped from the name/URL). 301 the old slug so
      // Behance/Pinterest/Google links keep resolving.
      {
        source: "/work/queen-lula-long-live-the-queen",
        destination: "/work/queen-lula",
        permanent: true,
      },
      // Anmetal lived under the old WordPress /services/ path; it's now a
      // project page. 301 to the live slug so the indexed URL consolidates.
      {
        source: "/services/anmetal-your-safety-comes-first-2",
        destination: "/work/anmetal-forged-through-design",
        permanent: true,
      },
      // Google also has an older Anmetal /services URL indexed under a different
      // tagline slug ("recipe" variant) that still 404s — send it to the same
      // live project page.
      {
        source: "/services/anmetal-your-recipe-comes-first-2",
        destination: "/work/anmetal-forged-through-design",
        permanent: true,
      },
      // Javy Coffee wasn't migrated as its own project — send the old indexed
      // URL to the portfolio index rather than letting it 404.
      {
        source: "/work/javy-coffee-brewing-online-success-through-seo-and-ppc",
        destination: "/work",
        permanent: true,
      },
      // Leftover WordPress staging URL (hashed temp domain prefix) that Google
      // still has indexed as a 404. The "team" page is now /people.
      {
        source: "/.website_875c5d33/team",
        destination: "/people",
        permanent: true,
      },
      // Renamed /work project slugs (old WordPress slugs → current Sanity slugs).
      // These still appear in GSC's internal-links graph from the old crawl;
      // 301 them to preserve link equity and stop the old URLs 404-ing.
      // NOTE: "Allure Clean Forms" is an unpublished draft, so its project page
      // 404s. Point the old URL to the portfolio index instead of a dead end.
      {
        source: "/work/allure-beauty-elegance-in-clean-forms",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/eos-mezze-bar-an-editorial-where-dining-sets-the-scene",
        destination: "/work/eos-mezze-bar-a-table-for-stories",
        permanent: true,
      },
      {
        source: "/work/eos-mezze-bar-greek-tradition-meets-modern-style",
        destination: "/work/eos-mezze-bar-the-art-of-mezze",
        permanent: true,
      },
      {
        source: "/work/alisa-dudaj-fashion-editorial-for-heritage-and-design",
        destination: "/work/alisa-dudaj-editorial-fashion-heritage",
        permanent: true,
      },
      {
        source: "/work/alisa-dudaj-merging-tradition-with-experimental-fashion-design",
        destination: "/work/alisa-dudaj-fashion-through-heritage",
        permanent: true,
      },
      {
        source: "/work/anmetal-forging-trust-through-innovative-design",
        destination: "/work/anmetal-forged-through-design",
        permanent: true,
      },
      {
        source: "/work/baboon-delivery-elevating-campaign-creativity",
        destination: "/work/baboon-delivery-campaigns-that-deliver",
        permanent: true,
      },
      {
        source: "/work/baboon-delivery-painting-the-town-red-with-new-btl-campaign",
        destination: "/work/baboon-delivery-paint-the-town-red",
        permanent: true,
      },
      {
        source: "/work/inas-farm-dairy-branding-with-a-playful-twist",
        destination: "/work/inas-farm-a-moo-d-for-dairy",
        permanent: true,
      },
      {
        source: "/work/albita-reviving-sweet-memories-with-a-fresh-twist",
        destination: "/work/albita-nostalgia-rewrapped",
        permanent: true,
      },
      // NOTE: "Ama Caffe" is an unpublished draft, so its project page 404s.
      // Point the old URL to the portfolio index instead of a dead end.
      {
        source: "/work/ama-caffe-capturing-coffee-culture-in-vivid-frames",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/borghese-milano-leather-accessories-spotlighted-with-elegance",
        destination: "/work/borghese-milano-leather-light-and-form",
        permanent: true,
      },
      {
        source: "/work/frenkcreative-from-lights-to-events-branding",
        destination: "/work/frenkcreative-lighting-up-events",
        permanent: true,
      },
      // Old WordPress project URLs whose current project is an UNPUBLISHED draft
      // (or wasn't migrated). Their /work/<slug> pages 404, so send the old URLs
      // to the portfolio index rather than dead-ending. Repoint to the specific
      // project if/when it's published.
      {
        source: "/work/fentimans-bold-botanicals-meeting-luxurious-flair",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/infratech-a-story-of-precision-legacy-branding",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/nfma-celebrating-strength-self-love",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/happy-pizza-crafting-joyful-branding-for-pizza-lovers",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/allure-beauty-aesthetic-excellence-in-beauty",
        destination: "/work",
        permanent: true,
      },
      // Old WordPress project slugs whose current project IS published — 301 to
      // the live project page to preserve link equity.
      {
        source: "/work/hako-simply-delicious-2",
        destination: "/work/hako-simply-delicious",
        permanent: true,
      },
      {
        source: "/work/timeless-crafting-a-minimalistic-logo-for-the-fashion-forward",
        destination: "/work/timeless-minimal-but-timeless",
        permanent: true,
      },
      // Old WordPress non-portfolio pages → current equivalents.
      {
        source: "/join-our-team",
        destination: "/people",
        permanent: true,
      },
      {
        source: "/branding",
        destination: "/services",
        permanent: true,
      },
      {
        source: "/cookie-policy-eu",
        destination: "/cookie-policy",
        permanent: true,
      },
      // Old WordPress diary used nested category paths (/diary/insights/…,
      // /diary/101-guides/…). The new diary is flat (/diary/<slug>) and those
      // posts weren't migrated — send any two-segment /diary URL to the index.
      {
        source: "/diary/:category/:slug",
        destination: "/diary",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
