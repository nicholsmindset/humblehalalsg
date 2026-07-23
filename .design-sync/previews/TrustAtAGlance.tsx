import { TrustAtAGlance, sampleListings } from "humblehalalsg";

export const MuisCertified = () => (
  <div style={{ maxWidth: 660 }}>
    <TrustAtAGlance
      item={{
        ...sampleListings[0],
        name: "Warung Bumbu Rempah",
        certBody: "MUIS",
        badges: ["muis", "owned", "family"],
        verify: {
          certNo: "MUIS-KH-2024-01839",
          verified: "2025-11-02",
          expires: "2027-11-01",
          confirms: 128,
          renewed: true,
        },
      }}
    />
  </div>
);

export const MuisListedPending = () => (
  <div style={{ maxWidth: 660 }}>
    <TrustAtAGlance
      item={{
        ...sampleListings[0],
        name: "Sedap Corner Nasi Lemak",
        certBody: "MUIS",
        badges: ["muis"],
        verify: {
          certNo: null,
          verified: null,
          expires: null,
          confirms: 21,
          renewed: false,
        },
      }}
    />
  </div>
);

export const AdminMuslimOwned = () => (
  <div style={{ maxWidth: 660 }}>
    <TrustAtAGlance
      item={{
        ...sampleListings[1],
        name: "Qahwa & Co.",
        certBody: "Humble Halal",
        badges: ["admin", "owned"],
        verify: {
          certNo: null,
          verified: "2025-09-14",
          expires: null,
          confirms: 47,
          renewed: false,
        },
      }}
    />
  </div>
);

export const SelfDeclared = () => (
  <div style={{ maxWidth: 660 }}>
    <TrustAtAGlance
      item={{
        ...sampleListings[2],
        name: "Tok Tok Mee Pok House",
        certBody: null,
        badges: ["friendly"],
        verify: undefined,
      }}
    />
  </div>
);
