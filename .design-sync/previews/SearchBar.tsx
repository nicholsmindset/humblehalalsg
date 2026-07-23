import { SearchBar, PreviewShell } from "humblehalalsg";

export const Filled = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <SearchBar value="Nasi padang Tampines" onChange={() => {}} />
    </div>
  </PreviewShell>
);

export const AreaQuery = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <SearchBar
        value="Halal cafés in Bugis"
        onChange={() => {}}
        placeholder="Search restaurants, cafés, hawker stalls…"
      />
    </div>
  </PreviewShell>
);

export const Empty = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <SearchBar
        value=""
        onChange={() => {}}
        placeholder="Search halal food near you in Singapore…"
      />
    </div>
  </PreviewShell>
);
