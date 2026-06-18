import { describe, it, expect } from "vitest";
import { computeFaraid, type Heirs } from "../../lib/tools/faraid";

const base: Heirs = { spouse: "none", father: false, mother: false, sons: 0, daughters: 0 };
function shares(h: Partial<Heirs>) {
  const r = computeFaraid({ ...base, ...h });
  const map: Record<string, number> = {};
  for (const s of r.shares) map[s.heir] = (map[s.heir] || 0) + s.fraction;
  return { map, total: r.total, note: r.note };
}
const approx = (a: number, b: number) => expect(a).toBeCloseTo(b, 5);

describe("faraid — shares always total the estate", () => {
  const cases: Partial<Heirs>[] = [
    { spouse: "wife", sons: 1, daughters: 1 },
    { spouse: "husband", daughters: 2, father: true, mother: true },
    { father: true, mother: true, sons: 1 },
    { spouse: "wife", father: true, mother: true, daughters: 2 },
    { sons: 2, daughters: 1 },
    { spouse: "husband", mother: true },
  ];
  it.each(cases)("totals ~1 for %o", (c) => {
    expect(shares(c).total).toBeCloseTo(1, 5);
  });
});

describe("faraid — wife + son + daughter", () => {
  it("wife 1/8, son & daughter share 7/8 at 2:1", () => {
    const { map } = shares({ spouse: "wife", sons: 1, daughters: 1 });
    approx(map.Wife, 1 / 8);
    approx(map.Son, (7 / 8) * (2 / 3));
    approx(map.Daughter, (7 / 8) * (1 / 3));
  });
});

describe("faraid — 'awl (husband + 2 daughters + father + mother), base 12 -> 15", () => {
  it("gives husband 3/15, daughters 8/15, father 2/15, mother 2/15", () => {
    const { map, note } = shares({ spouse: "husband", daughters: 2, father: true, mother: true });
    approx(map.Husband, 3 / 15);
    approx(map.Daughters, 8 / 15);
    approx(map.Father, 2 / 15);
    approx(map.Mother, 2 / 15);
    expect(note).toMatch(/awl/i);
  });
});

describe("faraid — classic 'awl base 24 -> 27 (wife + 2 daughters + father + mother)", () => {
  it("wife 3/27, daughters 16/27, father 4/27, mother 4/27", () => {
    const { map } = shares({ spouse: "wife", daughters: 2, father: true, mother: true });
    approx(map.Wife, 3 / 27);
    approx(map.Daughters, 16 / 27);
    approx(map.Father, 4 / 27);
    approx(map.Mother, 4 / 27);
  });
});

describe("faraid — 'Umariyyatayn", () => {
  it("husband + father + mother: husband 1/2, mother 1/6, father 1/3", () => {
    const { map } = shares({ spouse: "husband", father: true, mother: true });
    approx(map.Husband, 1 / 2);
    approx(map.Mother, 1 / 6);
    approx(map.Father, 1 / 3);
  });
  it("wife + father + mother: wife 1/4, mother 1/4, father 1/2", () => {
    const { map } = shares({ spouse: "wife", father: true, mother: true });
    approx(map.Wife, 1 / 4);
    approx(map.Mother, 1 / 4);
    approx(map.Father, 1 / 2);
  });
});

describe("faraid — only daughters + father (father takes 1/6 + residue)", () => {
  it("1 daughter + father + mother: daughter 1/2, mother 1/6, father 1/3", () => {
    const { map } = shares({ daughters: 1, father: true, mother: true });
    approx(map.Daughter, 1 / 2);
    approx(map.Mother, 1 / 6);
    approx(map.Father, 1 / 3);
  });
});

describe("faraid — radd (no residuary, surplus returns to non-spouse heirs)", () => {
  it("husband + mother only: husband 1/2, mother 1/2 (radd)", () => {
    const { map, note } = shares({ spouse: "husband", mother: true });
    approx(map.Husband, 1 / 2);
    approx(map.Mother, 1 / 2);
    expect(note).toMatch(/radd/i);
  });
});

describe("faraid — pure residuary children", () => {
  it("2 sons + 1 daughter: 4/5 to sons, 1/5 to daughter", () => {
    const { map } = shares({ sons: 2, daughters: 1 });
    approx(map.Sons, 4 / 5);
    approx(map.Daughter, 1 / 5);
  });
  it("father + mother + son: mother 1/6, father 1/6, son 2/3", () => {
    const { map } = shares({ father: true, mother: true, sons: 1 });
    approx(map.Mother, 1 / 6);
    approx(map.Father, 1 / 6);
    approx(map.Son, 2 / 3);
  });
});
