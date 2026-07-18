import { collection, config, fields } from "@keystatic/core";

const storage =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE_KIND === "github"
  ? ({ kind: "github", repo: "nicholsmindset/humblehalalsg" } as const)
  : ({ kind: "local" } as const);

const required = { validation: { isRequired: true } } as const;

export default config({
  storage,
  ui: {
    brand: { name: "Humble Halal CMS" },
  },
  collections: {
    authors: collection({
      label: "Authors",
      slugField: "name",
      path: "content/authors/*",
      format: { data: "json" },
      schema: {
        name: fields.slug({ name: { label: "Name", ...required } }),
        type: fields.select({
          label: "Type",
          defaultValue: "Person",
          options: [
            { label: "Person (named editor — best for E-E-A-T)", value: "Person" },
            { label: "Organization (team)", value: "Organization" },
          ],
        }),
        role: fields.text({ label: "Role / title" }),
        bio: fields.text({ label: "Bio", multiline: true }),
        avatarUpload: fields.image({
          label: "Avatar photo (upload)",
          description: "Upload a headshot. Takes priority over the URL below.",
          directory: "public/authors",
          publicPath: "/authors/",
        }),
        avatar: fields.text({ label: "Avatar image URL (used only if no upload above)" }),
        url: fields.text({ label: "Profile / author page URL" }),
        sameAs: fields.array(fields.text({ label: "Link", ...required }), {
          label: "Social / professional links",
          itemLabel: (props) => props.value || "link",
        }),
      },
    }),
    posts: collection({
      label: "Blog posts",
      slugField: "title",
      path: "content/posts/*",
      entryLayout: "content",
      schema: {
        title: fields.slug({ name: { label: "Title", ...required } }),
        status: fields.select({
          label: "Status",
          defaultValue: "draft",
          options: [
            { label: "Draft", value: "draft" },
            // Scheduled: hidden from the site until `datePublished` arrives (SGT),
            // then auto-published by the date-gate in lib/cms-blog.ts. Stays visible
            // and editable in this admin the whole time.
            { label: "Scheduled", value: "scheduled" },
            { label: "Published", value: "published" },
          ],
        }),
        dek: fields.text({ label: "Short description", multiline: true, ...required }),
        answer: fields.text({ label: "In short (40–70 words)", multiline: true, ...required }),
        author: fields.text({ label: "Author (display name)", defaultValue: "The Humble Halal Team", ...required }),
        authorId: fields.text({ label: "Author ID (optional — links to an Authors entry for byline + schema)" }),
        datePublished: fields.date({ label: "Publish date", ...required }),
        dateModified: fields.date({ label: "Last updated" }),
        readMins: fields.integer({ label: "Reading time (minutes)", defaultValue: 5, ...required }),
        category: fields.select({
          label: "Category",
          defaultValue: "restaurants-cafes",
          options: [
            { label: "Halal Basics", value: "halal-basics" },
            { label: "Restaurants & Cafés", value: "restaurants-cafes" },
            { label: "Cuisines", value: "cuisines" },
            { label: "Areas & Malls", value: "areas-malls" },
            { label: "Seasonal & Events", value: "seasonal-events" },
            { label: "Community & Business", value: "community-business" },
            { label: "Muslim Travel", value: "muslim-travel" },
            { label: "Halal Questions", value: "halal-questions" },
            { label: "Muslim Services", value: "muslim-services" },
            { label: "Prayers & Deen", value: "prayers-deen" },
          ],
        }),
        tags: fields.array(fields.text({ label: "Tag", ...required }), {
          label: "Tags",
          itemLabel: (props) => props.value || "Tag",
        }),
        imageUpload: fields.image({
          label: "Hero image (upload)",
          description: "Upload the hero image. Takes priority over the URL below; if neither is set, a branded card is used.",
          directory: "public/blog",
          publicPath: "/blog/",
        }),
        image: fields.text({ label: "Hero image URL or /public path (used only if no upload above)" }),
        imageAlt: fields.text({ label: "Hero image alt text", ...required }),
        imageCredit: fields.text({ label: "Image credit" }),
        sections: fields.array(
          fields.object({
            h2: fields.text({ label: "Heading", ...required }),
            body: fields.array(fields.text({ label: "Paragraph", multiline: true, ...required }), {
              label: "Paragraphs",
            }),
            bullets: fields.array(fields.text({ label: "Bullet", ...required }), { label: "Checklist / bullets" }),
            links: fields.array(
              fields.object({
                label: fields.text({ label: "Link label", ...required }),
                href: fields.url({ label: "URL", ...required }),
              }),
              { label: "Useful links", itemLabel: (props) => props.fields.label.value || "Link" },
            ),
            socialUrl: fields.url({ label: "TikTok video URL (optional)" }),
            socialLabel: fields.text({ label: "Social video caption" }),
            imageUpload: fields.image({
              label: "Section image (upload)",
              description: "Upload a section image. Takes priority over the URL below.",
              directory: "public/blog",
              publicPath: "/blog/",
            }),
            image: fields.text({ label: "Section image URL or /public path (used only if no upload above)" }),
            imageAlt: fields.text({ label: "Section image alt text" }),
            caption: fields.text({ label: "Section image caption" }),
          }),
          { label: "Article sections", itemLabel: (props) => props.fields.h2.value || "Section" },
        ),
        faq: fields.array(
          fields.object({
            q: fields.text({ label: "Question", ...required }),
            a: fields.text({ label: "Answer", multiline: true, ...required }),
          }),
          { label: "Frequently asked questions", itemLabel: (props) => props.fields.q.value || "Question" },
        ),
        related: fields.array(fields.text({ label: "Related post slug", ...required }), { label: "Related posts" }),
        dropcap: fields.checkbox({ label: "Drop cap on first paragraph", defaultValue: false }),
        pullQuote: fields.text({ label: "Pull quote", multiline: true }),
        pullQuoteBy: fields.text({ label: "Pull quote attribution" }),
        leadVertical: fields.text({ label: "Lead vertical ID (optional)" }),
        // --- SEO overrides (all optional; empty = sensible default) ---
        metaTitle: fields.text({ label: "SEO title override (optional)" }),
        metaDescription: fields.text({ label: "SEO meta description override (optional)", multiline: true }),
        canonicalUrl: fields.text({ label: "Canonical URL override (optional)" }),
        noindex: fields.checkbox({ label: "Hide from search engines (noindex)", defaultValue: false }),
        socialImageUpload: fields.image({
          label: "Social share image (upload, optional)",
          description: "Custom OG/social card. Takes priority over the URL below and the hero image.",
          directory: "public/blog",
          publicPath: "/blog/",
        }),
        socialImage: fields.text({ label: "Social share image URL override (used only if no upload above)" }),
      },
    }),
    // "Is <brand> halal?" checker entries. A CMS entry with the same slug as a
    // built-in brand (lib/halal-status.ts) OVERRIDES it, so the admin can
    // correct a status without a code change (see lib/cms-brands.ts).
    brands: collection({
      label: "Is-it-halal brands",
      slugField: "brand",
      path: "content/brands/*",
      format: { data: "json" },
      schema: {
        brand: fields.slug({ name: { label: "Brand name", ...required } }),
        logo: fields.image({
          label: "Brand logo (upload, optional)",
          description: "Shown in the header of the /is-halal/<brand> page. Optional.",
          directory: "public/brands",
          publicPath: "/brands/",
        }),
        category: fields.text({ label: "Category (e.g. Fast food, Bakery)", ...required }),
        status: fields.select({
          label: "Halal status",
          defaultValue: "unknown",
          options: [
            { label: "MUIS halal-certified", value: "certified" },
            { label: "Some outlets/items certified", value: "partial" },
            { label: "No pork — but not MUIS-certified", value: "no-pork" },
            { label: "Not MUIS halal-certified", value: "not-certified" },
            { label: "Status unconfirmed", value: "unknown" },
          ],
        }),
        answer: fields.text({ label: "Direct answer (40–60 words)", multiline: true, ...required }),
        source: fields.text({
          label: "Source",
          defaultValue: "MUIS HalalSG register + publicly available information",
        }),
        lastChecked: fields.text({ label: "Last checked (e.g. July 2026)", ...required }),
        aliases: fields.array(fields.text({ label: "Alias slug", ...required }), {
          label: "Alias slugs (alternate URLs)",
          itemLabel: (props) => props.value || "alias",
        }),
        // Curated depth — all optional. Fields left empty inherit the built-in
        // curated content for this slug (lib/halal-status-content.ts).
        certifiedSince: fields.text({ label: "Certified since (year, optional)" }),
        whyStatus: fields.array(fields.text({ label: "Bullet", multiline: true, ...required }), {
          label: "Why this status (bullets)",
          itemLabel: (props) => props.value || "bullet",
        }),
        watchFor: fields.array(fields.text({ label: "Item", multiline: true, ...required }), {
          label: "What to check / watch for",
          itemLabel: (props) => props.value || "item",
        }),
        alternatives: fields.array(
          fields.object({
            label: fields.text({ label: "Label", ...required }),
            slug: fields.text({ label: "Checker slug (optional — links to /is-halal/<slug>)" }),
            note: fields.text({ label: "Note (optional)" }),
          }),
          { label: "Halal alternatives (certified brands only)", itemLabel: (props) => props.fields.label.value || "alternative" },
        ),
        faqs: fields.array(
          fields.object({
            q: fields.text({ label: "Question", ...required }),
            a: fields.text({ label: "Answer", multiline: true, ...required }),
          }),
          { label: "FAQs", itemLabel: (props) => props.fields.q.value || "question" },
        ),
        explainer: fields.text({ label: "Status explainer override (optional)", multiline: true }),
      },
    }),
    // Mosque page overrides. An entry whose slug matches a mosque page slug
    // (e.g. "masjid-sultan") OVERLAYS its photo + optional copy on top of the
    // hardcoded profile in lib/mosque-content.ts, merged in lib/cms-mosques.ts.
    // Leave a field empty to keep the built-in default. No entry = no change.
    mosques: collection({
      label: "Mosque pages (photos & copy)",
      slugField: "name",
      path: "content/mosques/*",
      format: { data: "json" },
      schema: {
        // Type the mosque's exact name — the slug it derives (e.g. "Masjid
        // Sultan" → masjid-sultan) must match the /mosques/<slug> URL.
        name: fields.slug({ name: { label: "Mosque name (e.g. Masjid Sultan)", ...required } }),
        image: fields.image({
          label: "Mosque photo",
          description: "Upload a photo — becomes the page hero + share image. Optional; leave empty to use the branded card.",
          directory: "public/mosques",
          publicPath: "/mosques/",
        }),
        imageAlt: fields.text({ label: "Photo alt text (accessibility)" }),
        imageCredit: fields.text({ label: "Photo credit (optional)" }),
        intro: fields.text({ label: "Intro override (optional — replaces the default description)", multiline: true }),
      },
    }),
  },
});
