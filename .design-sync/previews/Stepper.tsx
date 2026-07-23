import { Stepper } from "humblehalalsg";

export const Adults = () => (
  <div style={{ maxWidth: 340 }}>
    <Stepper label="Adults" sub="Age 12+" value={2} min={1} max={9} onChange={() => {}} />
  </div>
);

export const ChildrenAtMin = () => (
  <div style={{ maxWidth: 340 }}>
    <Stepper label="Children" sub="Age 0–11" value={0} min={0} max={8} onChange={() => {}} />
  </div>
);

export const Rooms = () => (
  <div style={{ maxWidth: 340 }}>
    <Stepper label="Rooms" value={1} min={1} max={8} onChange={() => {}} />
  </div>
);
