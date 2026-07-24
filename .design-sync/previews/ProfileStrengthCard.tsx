import { ProfileStrengthCard } from "humblehalalsg";

const noop = (_tab: string) => {};

export const Complete = () => (
  <div style={{ maxWidth: 460 }}>
    <ProfileStrengthCard
      input={{
        photosCount: 12,
        descriptionLength: 180,
        hasHours: true,
        hasContact: true,
        hasWebsite: true,
        verified: true,
      }}
      onGoTab={noop}
    />
  </div>
);

export const AlmostThere = () => (
  <div style={{ maxWidth: 460 }}>
    <ProfileStrengthCard
      input={{
        photosCount: 5,
        descriptionLength: 140,
        hasHours: true,
        hasContact: true,
        hasWebsite: false,
        verified: false,
      }}
      onGoTab={noop}
    />
  </div>
);

export const JustListed = () => (
  <div style={{ maxWidth: 460 }}>
    <ProfileStrengthCard
      input={{
        photosCount: 1,
        descriptionLength: 40,
        hasHours: false,
        hasContact: true,
        hasWebsite: false,
        verified: false,
      }}
      onGoTab={noop}
    />
  </div>
);
