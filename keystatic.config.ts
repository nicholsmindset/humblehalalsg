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
            { label: "Published", value: "published" },
          ],
        }),
        dek: fields.text({ label: "Short description", multiline: true, ...required }),
        answer: fields.text({ label: "In short (40–70 words)", multiline: true, ...required }),
        author: fields.text({ label: "Author", defaultValue: "The Humble Halal Team", ...required }),
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
          ],
        }),
        tags: fields.array(fields.text({ label: "Tag", ...required }), {
          label: "Tags",
          itemLabel: (props) => props.value || "Tag",
        }),
        image: fields.text({ label: "Hero image URL or /public path", ...required }),
        imageAlt: fields.text({ label: "Hero image alt text", ...required }),
        imageCredit: fields.text({ label: "Image credit" }),
        sections: fields.array(
          fields.object({
            h2: fields.text({ label: "Heading", ...required }),
            body: fields.array(fields.text({ label: "Paragraph", multiline: true, ...required }), {
              label: "Paragraphs",
            }),
            bullets: fields.array(fields.text({ label: "Bullet", ...required }), { label: "Checklist / bullets" }),
            image: fields.text({ label: "Section image URL or /public path" }),
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
      },
    }),
  },
});
