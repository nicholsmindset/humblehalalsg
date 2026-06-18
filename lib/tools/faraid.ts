/* Simplified Islamic inheritance (Faraid) calculator.

   SCOPE (deliberately limited for correctness): the most common heirs —
   spouse (husband or wife), father, mother, sons and daughters. It applies the
   Qur'anic fixed shares, residuary ('asaba) for children/father, and the
   adjustments 'awl (proportional reduction when fixed shares exceed the estate)
   and radd (proportional return of surplus to fixed-share heirs other than a
   spouse). It does NOT handle siblings, grandparents, grandchildren, bequests
   (wasiyyah), debts, the 'Umariyyatayn special cases, or non-standard
   situations — those need a qualified faraid specialist.

   Returns each heir's fractional share of the (post-debt, post-bequest) estate.
   Educational only — always verify with a knowledgeable scholar. */

export interface Heirs {
  spouse: "husband" | "wife" | "none";
  father: boolean;
  mother: boolean;
  sons: number;
  daughters: number;
}

export interface Share {
  heir: string;
  fraction: number; // 0..1 of the estate
  basis: string; // short explanation
}

export interface FaraidResult {
  shares: Share[];
  note: string; // 'awl / radd / residuary note
  total: number; // should be ~1
}

const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b));

export function computeFaraid(h: Heirs): FaraidResult {
  const hasDescendants = h.sons > 0 || h.daughters > 0;
  const hasSons = h.sons > 0;

  // 'Umariyyatayn: a spouse with BOTH parents and no descendants. The mother
  // takes one-third of the REMAINDER after the spouse (not one-third of the
  // whole), and the father takes the rest as residuary.
  if (h.spouse !== "none" && h.father && h.mother && !hasDescendants) {
    const spouseFrac = h.spouse === "husband" ? 1 / 2 : 1 / 4;
    const mother = (1 - spouseFrac) / 3;
    const father = 1 - spouseFrac - mother;
    return {
      shares: [
        {
          heir: h.spouse === "husband" ? "Husband" : "Wife",
          fraction: spouseFrac,
          basis: h.spouse === "husband" ? "1/2 (no children)" : "1/4 (no children)",
        },
        { heir: "Mother", fraction: mother, basis: "1/3 of the remainder ('Umariyyatayn)" },
        { heir: "Father", fraction: father, basis: "remainder ('asaba)" },
      ],
      note: "'Umariyyatayn case: with a spouse and both parents (and no children), the mother takes one-third of what remains after the spouse's share.",
      total: 1,
    };
  }

  // Fixed-share heirs collect a fraction; residuary heirs share the remainder.
  type Fixed = { heir: string; num: number; den: number; basis: string };
  const fixed: Fixed[] = [];

  // Spouse
  if (h.spouse === "husband") {
    fixed.push(hasDescendants
      ? { heir: "Husband", num: 1, den: 4, basis: "1/4 (with children)" }
      : { heir: "Husband", num: 1, den: 2, basis: "1/2 (no children)" });
  } else if (h.spouse === "wife") {
    fixed.push(hasDescendants
      ? { heir: "Wife", num: 1, den: 8, basis: "1/8 (with children)" }
      : { heir: "Wife", num: 1, den: 4, basis: "1/4 (no children)" });
  }

  // Mother: 1/6 with descendants, else 1/3. (Sibling-based reduction and the
  // 'Umariyyatayn cases are out of scope.)
  if (h.mother) {
    fixed.push(hasDescendants
      ? { heir: "Mother", num: 1, den: 6, basis: "1/6 (with children)" }
      : { heir: "Mother", num: 1, den: 3, basis: "1/3 (no children)" });
  }

  // Father: 1/6 fixed when sons exist (no residue for him). With only daughters
  // he takes 1/6 fixed AND the residue (as 'asaba). With no descendants he is
  // pure residuary.
  let fatherResiduary = false;
  if (h.father) {
    if (hasSons) {
      fixed.push({ heir: "Father", num: 1, den: 6, basis: "1/6 (sons present)" });
    } else if (h.daughters > 0) {
      fixed.push({ heir: "Father", num: 1, den: 6, basis: "1/6 + residue" });
      fatherResiduary = true;
    } else {
      fatherResiduary = true; // residuary only
    }
  }

  // Daughters with no sons take a fixed share (1/2 one, 2/3 two+).
  const daughtersFixed = !hasSons && h.daughters > 0;
  if (daughtersFixed) {
    fixed.push(h.daughters === 1
      ? { heir: "Daughter", num: 1, den: 2, basis: "1/2 (one daughter, no sons)" }
      : { heir: "Daughters", num: 2, den: 3, basis: `2/3 (${h.daughters} daughters, no sons)` });
  }

  // Sum fixed shares over a common denominator.
  let den = 1;
  for (const f of fixed) den = (den * f.den) / g(den, f.den);
  let fixedNum = 0;
  const fixedScaled = fixed.map((f) => {
    const n = f.num * (den / f.den);
    fixedNum += n;
    return { ...f, scaledNum: n };
  });

  const shares: Share[] = [];
  let note = "";

  const residuaryExists = hasSons || fatherResiduary;

  if (fixedNum > den) {
    // 'Awl — reduce all fixed shares proportionally; no residue remains.
    note = "'Awl applied: fixed shares exceeded the estate, so all were reduced proportionally.";
    for (const f of fixedScaled) shares.push({ heir: f.heir, fraction: f.scaledNum / fixedNum, basis: f.basis });
  } else {
    // Assign fixed shares as-is.
    for (const f of fixedScaled) shares.push({ heir: f.heir, fraction: f.scaledNum / den, basis: f.basis });
    const residueNum = den - fixedNum;

    if (residueNum > 0 && residuaryExists) {
      const residue = residueNum / den;
      if (hasSons) {
        // Sons & daughters share residue 2:1.
        const parts = h.sons * 2 + h.daughters;
        if (h.sons > 0) shares.push({ heir: h.sons === 1 ? "Son" : "Sons", fraction: residue * ((h.sons * 2) / parts), basis: `residue, 2:1 (${h.sons} son${h.sons > 1 ? "s" : ""})` });
        if (h.daughters > 0) shares.push({ heir: h.daughters === 1 ? "Daughter" : "Daughters", fraction: residue * (h.daughters / parts), basis: `residue, 2:1 (${h.daughters} daughter${h.daughters > 1 ? "s" : ""})` });
        if (fatherResiduary) { /* not reached: father is fixed 1/6 when sons present */ }
      } else if (fatherResiduary) {
        shares.push({ heir: "Father", fraction: residue, basis: "residue (as 'asaba)" });
        // merge with father's fixed 1/6 line for clarity
      }
      if (!note) note = "Children (and father where applicable) take the remainder as residuary heirs ('asaba).";
    } else if (residueNum > 0 && !residuaryExists) {
      // Radd — return surplus to fixed-share heirs except the spouse.
      const spouse = shares.find((s) => s.heir === "Husband" || s.heir === "Wife");
      const others = shares.filter((s) => s !== spouse);
      const othersTotal = others.reduce((t, s) => t + s.fraction, 0);
      const surplus = residueNum / den;
      if (othersTotal > 0) {
        for (const s of others) s.fraction += surplus * (s.fraction / othersTotal);
        note = spouse
          ? "Radd applied: surplus returned proportionally to heirs other than the spouse."
          : "Radd applied: surplus returned proportionally to the fixed-share heirs.";
      }
    }
  }

  // Merge father's two lines (fixed 1/6 + residue) into one if both present.
  const fatherLines = shares.filter((s) => s.heir === "Father");
  if (fatherLines.length === 2) {
    const merged = { heir: "Father", fraction: fatherLines[0].fraction + fatherLines[1].fraction, basis: "1/6 + residue" };
    const rest = shares.filter((s) => s.heir !== "Father");
    rest.push(merged);
    shares.length = 0;
    shares.push(...rest);
  }

  const total = shares.reduce((t, s) => t + s.fraction, 0);
  return { shares, note, total };
}
