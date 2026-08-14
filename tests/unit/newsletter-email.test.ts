import { describe, expect, it } from "vitest";
import { newsletterSignupEmail } from "@/lib/emails/newsletter";

describe("newsletterSignupEmail", () => {
  it.each([
    ["home-guide", "newsletter-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["best-restaurants", "newsletter-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["weekend-planner:home", "newsletter-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["guides", "newsletter-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["cert-changes", "newsletter-certification-updates", "/halal-certification-changes"],
    ["is-halal-brand", "newsletter-certification-updates", "/halal-certification-changes"],
    ["hawker", "newsletter-hawker", "/hawker"],
    ["hawker-centre", "newsletter-hawker", "/hawker"],
    ["events", "newsletter-events", "/events"],
    ["travel", "newsletter-travel", "/travel"],
    ["ramadan", "newsletter-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["hari-raya", "newsletter-hari-raya-checklist", "/hari-raya"],
    ["for-business", "newsletter-owner-starter-kit", "/for-business"],
    ["advertise", "newsletter-advertising-kit", "/advertise"],
    ["waktu-solat-hub", "newsletter-prayer-times", "/waktu-solat-singapore"],
    ["tool:zakat", "newsletter-tool-zakat", "/tools/zakat"],
    ["tool:inheritance", "newsletter-tool-inheritance", "/tools/inheritance"],
    ["tool:halal-stocks", "newsletter-tool-halal-stocks", "/tools/halal-stocks"],
    ["tool:prayer-times", "newsletter-prayer-times", "/waktu-solat-singapore"],
    ["tool:ingredient-checker", "newsletter-tool-ingredient-checker", "/tools/ingredient-checker"],
    ["tool:quran", "newsletter-tools", "/tools"],
    ["ms-makanan-halal", "newsletter-ms-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["ms-masjid", "newsletter-ms-mosque", "/mosques"],
    ["ms-ramadan", "newsletter-ms-weekend-planner", "/guides/halal-weekend-planner-singapore.pdf"],
    ["ms-hari-raya", "newsletter-ms-hari-raya", "/ms/hari-raya"],
  ])("maps %s to %s", (source, template, link) => {
    const email = newsletterSignupEmail({ source, name: "Aminah" });
    expect(email.template).toBe(template);
    expect(email.html).toContain(link);
    expect(email.html).toContain("Assalamualaikum Aminah,");
  });

  it("falls back safely and escapes a supplied first name", () => {
    const email = newsletterSignupEmail({ source: "unknown", name: '<script>alert("x")</script>' });
    expect(email.template).toBe("newsletter-weekend-planner");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("uses a friendly fallback greeting in English and Malay", () => {
    expect(newsletterSignupEmail({ source: "footer" }).html).toContain("Assalamualaikum there,");
    expect(newsletterSignupEmail({ source: "ms-masjid" }).html).toContain("Assalamualaikum sahabat,");
  });
});
