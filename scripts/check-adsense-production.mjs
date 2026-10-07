import { readFileSync } from "node:fs";

// NEXT_PUBLIC values are frozen into the browser bundle during the build.
// In particular, Vercel Secret values are not exported by `vercel pull` for
// GitHub's prebuilt deployment. Reject a release that would silently hide ads.
if (process.env.VERCEL_ENV === "production" || process.argv.includes("--production")) {
  const publisher = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const seller = readFileSync(new URL("../public/ads.txt", import.meta.url), "utf8")
    .match(/^google\.com,\s*(pub-\d{16}),\s*DIRECT\b/m)?.[1];
  if (!seller || publisher !== `ca-${seller}`) {
    console.error("Production AdSense configuration is missing or does not match public/ads.txt. " +
      "Store NEXT_PUBLIC_ADSENSE_CLIENT as readable public configuration in Vercel, " +
      "pull the production environment again, and rebuild.");
    process.exitCode = 1;
  } else {
    console.log("Production AdSense publisher matches ads.txt.");
  }
}
