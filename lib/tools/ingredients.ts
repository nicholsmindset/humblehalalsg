/* Humble Halal — "Is this ingredient/E-number halal?" reference dataset.

   ACCURACY POLICY (read before editing):
   - We classify additives by their COMMON ORIGIN, not by any specific product.
     A "halal" additive can still appear in a non-halal product, and a product
     using only halal additives is NOT thereby halal-certified.
   - When an additive can be EITHER animal- or plant-derived (source-dependent),
     it is "mushbooh" (doubtful) — never assume halal. This is the honest
     default and matches how MUIS/most halal bodies treat these.
   - "haram" here means the COMMON commercial source is impermissible (e.g.
     insect- or alcohol-derived, or gelatine from non-halal animals). A
     halal-certified version may still exist (e.g. halal gelatine, plant carmine
     substitutes) — the note says so.
   - Humble Halal is NOT a certifier. For any product, verify on the MUIS
     HalalSG register or with the manufacturer. This is general guidance only.

   Sources: additive origin is well-documented reference chemistry; classifications
   follow the conservative consensus of published halal-additive guides. */

export type AdditiveStatus = "halal" | "mushbooh" | "haram";

export interface Additive {
  /** E-number, uppercase, no space, e.g. "E471". "" for name-only entries. */
  code: string;
  name: string;
  category: AdditiveCategory;
  status: AdditiveStatus;
  /** Short origin/why (the answer-first unit). */
  origin: string;
  /** Caveat — when a halal version exists, or what to check. */
  note?: string;
  /** Extra search terms (common names, spellings). */
  aliases?: string[];
}

export type AdditiveCategory =
  | "Colour" | "Preservative" | "Antioxidant" | "Acidity regulator"
  | "Emulsifier & stabiliser" | "Thickener" | "Flavour enhancer"
  | "Sweetener" | "Glazing & wax" | "Anti-caking" | "Flour treatment" | "Other";

export const STATUS_META: Record<AdditiveStatus, { label: string; verdict: string; tone: string }> = {
  halal: { label: "Generally halal", verdict: "Halal", tone: "yes" },
  mushbooh: { label: "Doubtful — depends on source", verdict: "Doubtful", tone: "warn" },
  haram: { label: "Commonly non-halal — check for a certified version", verdict: "Avoid", tone: "no" },
};

/* Curated list of the additives people most often search ("is E471 halal",
   "is gelatine halal", "is carmine halal"). Conservative by policy. */
export const ADDITIVES: Additive[] = [
  // ── Colours ──────────────────────────────────────────────────────────────
  { code: "E100", name: "Curcumin", category: "Colour", status: "halal", origin: "Yellow colour from turmeric root — plant-derived.", aliases: ["turmeric"] },
  { code: "E101", name: "Riboflavin (Vitamin B2)", category: "Colour", status: "mushbooh", origin: "Yellow colour/vitamin; can be produced from microbial fermentation or animal-derived media.", note: "Synthetic and fermentation-based versions are halal — check the source." },
  { code: "E102", name: "Tartrazine", category: "Colour", status: "halal", origin: "Synthetic azo dye — not animal-derived." },
  { code: "E104", name: "Quinoline Yellow", category: "Colour", status: "halal", origin: "Synthetic dye." },
  { code: "E110", name: "Sunset Yellow FCF", category: "Colour", status: "halal", origin: "Synthetic azo dye.", aliases: ["orange yellow"] },
  { code: "E120", name: "Cochineal / Carmine / Carminic acid", category: "Colour", status: "haram", origin: "Red colour extracted from cochineal insects.", note: "Most scholars consider insect-derived carmine impermissible; plant-based red colours are a halal alternative.", aliases: ["carmine", "cochineal", "carminic acid", "e120", "natural red 4"] },
  { code: "E122", name: "Azorubine / Carmoisine", category: "Colour", status: "halal", origin: "Synthetic azo dye." },
  { code: "E124", name: "Ponceau 4R", category: "Colour", status: "halal", origin: "Synthetic azo dye." },
  { code: "E127", name: "Erythrosine", category: "Colour", status: "halal", origin: "Synthetic dye." },
  { code: "E129", name: "Allura Red AC", category: "Colour", status: "halal", origin: "Synthetic azo dye.", aliases: ["red 40"] },
  { code: "E132", name: "Indigo Carmine", category: "Colour", status: "halal", origin: "Synthetic dye (despite the name, not from insects)." },
  { code: "E140", name: "Chlorophyll", category: "Colour", status: "halal", origin: "Green colour from plants." },
  { code: "E150", name: "Caramel colour", category: "Colour", status: "mushbooh", origin: "Made by heating sugars; usually halal, but some processes may use trace alcohol or ammonia.", note: "Plain caramel (E150a) is generally halal; verify if avoiding all alcohol traces." },
  { code: "E153", name: "Vegetable carbon", category: "Colour", status: "mushbooh", origin: "Black colour from charred plant matter — but 'carbon black' can also be animal bone char.", note: "Confirm it is vegetable-sourced, not bone char." },
  { code: "E160a", name: "Beta-carotene", category: "Colour", status: "mushbooh", origin: "Orange colour; the colour itself is plant/synthetic, but it is often stabilised in a gelatine carrier.", note: "Gelatine-free (e.g. starch-encapsulated) versions are halal." },
  { code: "E160b", name: "Annatto", category: "Colour", status: "halal", origin: "Orange colour from annatto seeds — plant-derived." },
  { code: "E160c", name: "Paprika extract", category: "Colour", status: "halal", origin: "From paprika/peppers — plant-derived." },
  { code: "E162", name: "Beetroot Red (Betanin)", category: "Colour", status: "halal", origin: "Red colour from beetroot — plant-derived.", aliases: ["betanin"] },
  { code: "E163", name: "Anthocyanins", category: "Colour", status: "halal", origin: "Purple/red colours from fruits and vegetables." },
  { code: "E170", name: "Calcium carbonate", category: "Colour", status: "halal", origin: "Mineral (chalk)." },
  { code: "E171", name: "Titanium dioxide", category: "Colour", status: "halal", origin: "White mineral pigment.", note: "Banned as a food additive in some countries for safety reasons — that is separate from its halal status." },
  { code: "E172", name: "Iron oxides & hydroxides", category: "Colour", status: "halal", origin: "Mineral pigments." },

  // ── Preservatives ────────────────────────────────────────────────────────
  { code: "E200", name: "Sorbic acid", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
  { code: "E202", name: "Potassium sorbate", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
  { code: "E210", name: "Benzoic acid", category: "Preservative", status: "halal", origin: "Synthetic/plant preservative." },
  { code: "E211", name: "Sodium benzoate", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
  { code: "E220", name: "Sulphur dioxide", category: "Preservative", status: "halal", origin: "Chemical preservative." },
  { code: "E223", name: "Sodium metabisulphite", category: "Preservative", status: "halal", origin: "Chemical preservative." },
  { code: "E250", name: "Sodium nitrite", category: "Preservative", status: "halal", origin: "Curing salt (chemical).", note: "Halal in itself — but often used to cure meats; the MEAT must be halal." },
  { code: "E251", name: "Sodium nitrate", category: "Preservative", status: "halal", origin: "Curing salt (chemical)." },
  { code: "E260", name: "Acetic acid", category: "Preservative", status: "mushbooh", origin: "Vinegar acid; halal when synthetic or from halal vinegar, but can be derived from wine vinegar.", note: "Vinegar from wine is treated as halal by many scholars once fully converted; confirm if strict." },
  { code: "E270", name: "Lactic acid", category: "Preservative", status: "halal", origin: "Usually made by bacterial fermentation of plant sugars.", note: "Very rarely uses dairy; generally accepted as halal." },
  { code: "E280", name: "Propionic acid", category: "Preservative", status: "halal", origin: "Synthetic preservative." },

  // ── Antioxidants ───────────────────────────────────────────────────────────
  { code: "E300", name: "Ascorbic acid (Vitamin C)", category: "Antioxidant", status: "halal", origin: "Synthetic/plant vitamin C.", aliases: ["vitamin c"] },
  { code: "E301", name: "Sodium ascorbate", category: "Antioxidant", status: "halal", origin: "Salt of Vitamin C." },
  { code: "E304", name: "Ascorbyl palmitate", category: "Antioxidant", status: "mushbooh", origin: "Vitamin C bonded to palmitic acid — the palmitate can be animal- or plant-derived.", note: "Plant-derived versions are halal." },
  { code: "E306", name: "Tocopherols (Vitamin E)", category: "Antioxidant", status: "mushbooh", origin: "Usually extracted from vegetable oils, but the carrier oil source can vary.", note: "Most commercial Vitamin E is soy-derived (halal); confirm if strict.", aliases: ["vitamin e", "tocopherol"] },
  { code: "E322", name: "Lecithin", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Emulsifier usually from soybeans (halal), but can be from egg yolk.", note: "Soy lecithin is halal; egg lecithin is halal only if the egg is; sunflower lecithin is halal.", aliases: ["soy lecithin", "soya lecithin"] },
  { code: "E325", name: "Sodium lactate", category: "Acidity regulator", status: "halal", origin: "Salt of lactic acid (usually plant-fermented)." },

  // ── Acidity regulators ─────────────────────────────────────────────────────
  { code: "E330", name: "Citric acid", category: "Acidity regulator", status: "halal", origin: "Made by fermentation of sugars — plant-based.", aliases: ["sour salt"] },
  { code: "E331", name: "Sodium citrate", category: "Acidity regulator", status: "halal", origin: "Salt of citric acid." },
  { code: "E333", name: "Calcium citrate", category: "Acidity regulator", status: "halal", origin: "Salt of citric acid." },
  { code: "E338", name: "Phosphoric acid", category: "Acidity regulator", status: "halal", origin: "Mineral acid." },
  { code: "E339", name: "Sodium phosphates", category: "Acidity regulator", status: "halal", origin: "Mineral salts." },
  { code: "E341", name: "Calcium phosphate", category: "Acidity regulator", status: "halal", origin: "Mineral salt.", note: "Distinct from E542 (bone phosphate), which is animal-derived." },

  // ── Thickeners, emulsifiers & stabilisers ──────────────────────────────────
  { code: "E400", name: "Alginic acid", category: "Thickener", status: "halal", origin: "From brown seaweed." },
  { code: "E406", name: "Agar", category: "Thickener", status: "halal", origin: "Gelling agent from seaweed — a common halal alternative to gelatine.", aliases: ["agar agar"] },
  { code: "E407", name: "Carrageenan", category: "Thickener", status: "halal", origin: "From red seaweed." },
  { code: "E410", name: "Locust bean gum", category: "Thickener", status: "halal", origin: "From carob seeds — plant.", aliases: ["carob gum"] },
  { code: "E412", name: "Guar gum", category: "Thickener", status: "halal", origin: "From guar beans — plant." },
  { code: "E414", name: "Gum arabic (Acacia gum)", category: "Thickener", status: "halal", origin: "From acacia tree sap — plant.", aliases: ["acacia gum"] },
  { code: "E415", name: "Xanthan gum", category: "Thickener", status: "halal", origin: "Made by fermentation of sugars." },
  { code: "E440", name: "Pectin", category: "Thickener", status: "halal", origin: "From fruit — plant-based gelling agent." },
  { code: "E420", name: "Sorbitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol, usually from corn/glucose." },
  { code: "E421", name: "Mannitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol." },
  { code: "E422", name: "Glycerol / Glycerine", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Can be from plant oils, synthetic, or animal fat.", note: "Plant/synthetic glycerine is halal; animal-fat glycerine is not unless from halal animals.", aliases: ["glycerin", "glycerine", "glycerol"] },
  { code: "E441", name: "Gelatine", category: "Emulsifier & stabiliser", status: "haram", origin: "Made from animal skin/bone — commonly pork or non-halal beef.", note: "Halal-certified gelatine (from halal-slaughtered cattle) and plant substitutes (agar, pectin, carrageenan) exist.", aliases: ["gelatin", "gelatine", "e441"] },
  { code: "E450", name: "Diphosphates", category: "Acidity regulator", status: "halal", origin: "Mineral phosphate salts." },
  { code: "E466", name: "Carboxymethylcellulose (CMC)", category: "Thickener", status: "halal", origin: "From plant cellulose.", aliases: ["cmc", "cellulose gum"] },
  { code: "E470", name: "Fatty acid salts (Mg/Na/K stearates)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Salts of fatty acids that can be animal- or plant-derived." },
  { code: "E471", name: "Mono- and diglycerides of fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Emulsifier made from fatty acids that can be plant- OR animal-derived.", note: "One of the most common additives. Plant-derived (e.g. palm/soy) is halal; animal-fat sourced is doubtful. Manufacturers must be asked.", aliases: ["monoglycerides", "diglycerides", "e471", "mono and diglycerides"] },
  { code: "E472e", name: "Mono/diacetyl tartaric acid esters (DATEM)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Ester of glycerides whose fat source can be animal or plant.", aliases: ["datem", "e472"] },
  { code: "E475", name: "Polyglycerol esters of fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid esters; source can be animal or plant." },
  { code: "E476", name: "Polyglycerol polyricinoleate (PGPR)", category: "Emulsifier & stabiliser", status: "halal", origin: "Made from castor oil — plant-derived.", aliases: ["pgpr"] },
  { code: "E481", name: "Sodium stearoyl-2-lactylate (SSL)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Stearoyl (fatty acid) source can be animal or plant.", aliases: ["ssl"] },
  { code: "E482", name: "Calcium stearoyl-2-lactylate (CSL)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Stearoyl (fatty acid) source can be animal or plant.", aliases: ["csl"] },
  { code: "E491", name: "Sorbitan monostearate", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid ester; source can be animal or plant." },

  // ── Anti-caking & minerals ─────────────────────────────────────────────────
  { code: "E500", name: "Sodium bicarbonate (baking soda)", category: "Acidity regulator", status: "halal", origin: "Mineral salt.", aliases: ["baking soda", "bicarbonate of soda"] },
  { code: "E501", name: "Potassium carbonate", category: "Acidity regulator", status: "halal", origin: "Mineral salt." },
  { code: "E508", name: "Potassium chloride", category: "Other", status: "halal", origin: "Mineral salt." },
  { code: "E509", name: "Calcium chloride", category: "Other", status: "halal", origin: "Mineral salt." },
  { code: "E524", name: "Sodium hydroxide", category: "Acidity regulator", status: "halal", origin: "Alkali (lye) — mineral/chemical." },
  { code: "E542", name: "Bone phosphate (edible)", category: "Anti-caking", status: "mushbooh", origin: "Made from animal bones — the animal source is usually unspecified.", note: "Halal only if from halal-slaughtered animals; mineral phosphates (E341) are a halal alternative.", aliases: ["bone phosphate"] },
  { code: "E551", name: "Silicon dioxide", category: "Anti-caking", status: "halal", origin: "Mineral (silica).", aliases: ["silica"] },
  { code: "E570", name: "Stearic acid / Fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty acid that can be animal- or plant-derived." },
  { code: "E572", name: "Magnesium stearate", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid salt; source can be animal or plant." },
  { code: "E575", name: "Glucono delta-lactone (GDL)", category: "Acidity regulator", status: "halal", origin: "From glucose — plant-based.", aliases: ["gdl"] },

  // ── Flavour enhancers ──────────────────────────────────────────────────────
  { code: "E621", name: "Monosodium glutamate (MSG)", category: "Flavour enhancer", status: "halal", origin: "Made by fermentation of plant starches/molasses.", note: "Widely accepted as halal; a small number of bodies flag the fermentation medium — check if strict.", aliases: ["msg", "monosodium glutamate", "e621", "ajinomoto"] },
  { code: "E627", name: "Disodium guanylate", category: "Flavour enhancer", status: "mushbooh", origin: "Flavour enhancer that can be derived from yeast, fish, or meat.", note: "Often paired with E631; the animal/fish source is usually unstated." },
  { code: "E631", name: "Disodium inosinate", category: "Flavour enhancer", status: "mushbooh", origin: "Commonly derived from fish or meat (can also be microbial).", note: "Very common in snacks/instant noodles; confirm the source.", aliases: ["e631"] },
  { code: "E635", name: "Disodium 5'-ribonucleotides", category: "Flavour enhancer", status: "mushbooh", origin: "Blend of E627/E631; source can be animal, fish or microbial." },
  { code: "E640", name: "Glycine & sodium glycinate", category: "Flavour enhancer", status: "mushbooh", origin: "Amino acid that can be synthetic or animal-derived." },

  // ── Glazing, waxes & flour treatment ───────────────────────────────────────
  { code: "E901", name: "Beeswax", category: "Glazing & wax", status: "halal", origin: "Produced by honeybees — generally permissible, like honey." },
  { code: "E903", name: "Carnauba wax", category: "Glazing & wax", status: "halal", origin: "From the carnauba palm — plant-derived." },
  { code: "E904", name: "Shellac", category: "Glazing & wax", status: "mushbooh", origin: "Resin secreted by the lac insect.", note: "Scholars differ — some permit it as a secretion (like honey), others avoid it as insect-derived." },
  { code: "E920", name: "L-Cysteine", category: "Flour treatment", status: "mushbooh", origin: "Dough conditioner that can be made from human hair, duck/chicken feathers, or synthetically.", note: "Synthetic and microbial L-cysteine is halal; feather/hair-derived is doubtful.", aliases: ["cysteine", "e920"] },

  // ── Sweeteners ─────────────────────────────────────────────────────────────
  { code: "E950", name: "Acesulfame K", category: "Sweetener", status: "halal", origin: "Synthetic sweetener.", aliases: ["ace k"] },
  { code: "E951", name: "Aspartame", category: "Sweetener", status: "halal", origin: "Synthetic sweetener." },
  { code: "E954", name: "Saccharin", category: "Sweetener", status: "halal", origin: "Synthetic sweetener." },
  { code: "E955", name: "Sucralose", category: "Sweetener", status: "halal", origin: "Synthetic sweetener made from sugar." },
  { code: "E960", name: "Steviol glycosides (Stevia)", category: "Sweetener", status: "halal", origin: "From the stevia plant.", aliases: ["stevia"] },
  { code: "E965", name: "Maltitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol from starch." },
  { code: "E967", name: "Xylitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol from plant fibre." },

  // ── Other / alcohol ────────────────────────────────────────────────────────
  { code: "E1105", name: "Lysozyme", category: "Preservative", status: "mushbooh", origin: "Enzyme usually extracted from egg white.", note: "Halal if the egg source is acceptable; some avoid due to processing aids." },
  { code: "E1400", name: "Modified starches (E1400–E1450)", category: "Thickener", status: "halal", origin: "Chemically/physically modified plant starch.", aliases: ["modified starch", "modified corn starch"] },
  { code: "E1510", name: "Ethanol (ethyl alcohol)", category: "Other", status: "haram", origin: "Drinking alcohol used as a carrier/solvent.", note: "Intoxicating alcohol is impermissible. Trace ethanol from natural fermentation is treated differently by scholars — but added ethanol is best avoided.", aliases: ["ethanol", "ethyl alcohol", "alcohol"] },
  { code: "", name: "Rennet", category: "Other", status: "mushbooh", origin: "Enzyme used to make cheese; can be from animal stomach (halal only if from a halal animal), or microbial/plant (halal).", note: "Look for 'microbial rennet' or 'vegetarian rennet' — those are halal.", aliases: ["rennet", "cheese enzyme"] },
  { code: "", name: "Carmine (natural red 4)", category: "Colour", status: "haram", origin: "See E120 — insect-derived red colour.", aliases: ["carmine", "natural red 4"] },
];

/* Normalise a query for matching against code/name/aliases. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s.\-']/g, "");
}

/** Search additives by E-number, name or alias. Empty query → all. */
export function searchAdditives(query: string): Additive[] {
  const q = norm(query);
  if (!q) return ADDITIVES;
  return ADDITIVES.filter((a) => {
    if (a.code && norm(a.code).includes(q)) return true;
    // "471" should also match "E471"
    if (a.code && norm(a.code).replace(/^e/, "").includes(q.replace(/^e/, ""))) return true;
    if (norm(a.name).includes(q)) return true;
    return (a.aliases || []).some((al) => norm(al).includes(q));
  });
}

export const ADDITIVE_COUNT = ADDITIVES.length;
export function countByStatus(status: AdditiveStatus): number {
  return ADDITIVES.filter((a) => a.status === status).length;
}
