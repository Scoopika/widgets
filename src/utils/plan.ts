export type PlanType = "free" | "basic" | "scale";

export default function readPlan(plan: string) {
  if (plan === "none" || plan === "free" || !plan.includes(":::")) {
    return "free";
  }

  if (plan.startsWith("SPECIAL_BASIC")) {
    return "basic";
  }

  if (plan.startsWith("SPECIAL_SCALE")) {
    return "scale";
  }

  let type = (plan.split(":::")[2] || "free") as PlanType;

  if (["free", "basic", "scale"].indexOf(type) === -1) {
    type = "free";
  }

  return type as PlanType;
}
