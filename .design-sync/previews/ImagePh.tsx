import { ImagePh, BusinessMediaFallback } from "humblehalalsg";

const box = { width: 280, height: 170, borderRadius: 14, overflow: "hidden" as const };
const fill = { width: "100%", height: "100%" };

export const CreamTone = () => (
  <div style={box}>
    <ImagePh tone="cream" icon="camera" style={fill} />
  </div>
);

export const GoldTone = () => (
  <div style={box}>
    <ImagePh tone="gold" icon="utensils" style={fill} />
  </div>
);

export const EmeraldTone = () => (
  <div style={box}>
    <ImagePh tone="emerald" icon="coffee" style={{ ...fill, color: "#fff" }} />
  </div>
);

export const WithFallback = () => (
  <div style={box}>
    <ImagePh
      tone="gold"
      style={fill}
      fallback={<BusinessMediaFallback name="Warung Bumbu Rempah" category="Nasi Padang" area="Tampines" />}
    />
  </div>
);
