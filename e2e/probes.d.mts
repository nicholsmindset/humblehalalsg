/* Type surface for e2e/probes.mjs (shared by the audit script + mobile spec). */

export const SCROLLER_ALLOWLIST: string[];
export const PRIMARY_CTA_SELECTOR: string;

export interface OverflowFinding {
  selector: string;
  left: number;
  right: number;
  width: number;
  clientWidth: number;
  overflowPx: number;
  text: string;
}
export function overflowProbe(allowSelector: string): OverflowFinding[];

export interface TapFinding {
  selector: string;
  w: number;
  h: number;
  tier: "fail" | "warn" | "note";
  primaryCta: boolean;
  text: string;
}
export function tapTargetProbe(primaryCtaSelector: string): TapFinding[];

export interface TextFinding {
  classChain: string;
  px: number;
  count: number;
  sample: string;
}
export function smallTextProbe(): TextFinding[];

export interface InputZoomFinding {
  selector: string;
  px: number;
  placeholder: string;
}
export function inputZoomProbe(): InputZoomFinding[];
