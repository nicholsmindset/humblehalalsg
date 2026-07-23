import { AuthorBio } from "humblehalalsg";

const col = { maxWidth: 620, padding: "12px 28px 28px" } as const;

const avatar =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='96'%20height='96'%3E%3Crect%20width='96'%20height='96'%20fill='%2312525B'/%3E%3Ctext%20x='48'%20y='60'%20font-size='38'%20fill='%23C97D3F'%20text-anchor='middle'%20font-family='Georgia'%3ENR%3C/text%3E%3C/svg%3E";

const editor = {
  id: "nurul-rahman",
  name: "Nurul Rahman",
  type: "Person" as const,
  role: "Halal dining editor",
  bio: "Nurul has spent a decade eating across Singapore’s halal scene, from Geylang Serai hawker stalls to certified hotel buffets. She cross-checks every claim against the MUIS HalalSG register before it goes live.",
  sameAs: [
    "https://www.instagram.com/humblehalal.sg",
    "https://www.linkedin.com/company/humblehalal",
  ],
};

export const TeamFallback = () => (
  <div style={col}>
    <AuthorBio />
  </div>
);

export const NamedEditor = () => (
  <div style={col}>
    <AuthorBio author={editor} />
  </div>
);

export const WithAvatar = () => (
  <div style={col}>
    <AuthorBio author={{ ...editor, avatar }} />
  </div>
);
