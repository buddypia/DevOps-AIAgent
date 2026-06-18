import type { CiProof } from "./proof.js";

export function ciStatusFromBadge(svg: string): CiProof["status"] {
  const normalized = svg.toLowerCase();
  if (normalized.includes("passing") || normalized.includes("success")) return "passed";
  if (normalized.includes("failing") || normalized.includes("failure") || normalized.includes("cancelled")) return "missing";
  return "watch";
}
