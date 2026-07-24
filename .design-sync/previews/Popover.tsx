import { Popover, Icon } from "humblehalalsg";

const noop = () => {};

export const Open = () => (
  <div style={{ padding: 16, minHeight: 220 }}>
    <Popover
      open
      onClose={noop}
      align="left"
      panelLabel="Sort listings"
      trigger={
        <button className="btn btn-soft btn-sm">
          <Icon name="sort" size={15} /> Sort
        </button>
      }
    >
      <div style={{ display: "grid", gap: 4, minWidth: 200 }}>
        <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }}>Most relevant</button>
        <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }}>Highest rated</button>
        <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }}>Nearest to me</button>
        <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }}>Newly opened</button>
      </div>
    </Popover>
  </div>
);
