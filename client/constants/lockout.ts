import { getTuning } from "@/lib/tuning";

const tuning = getTuning();

export function getLockoutLabRequestTarget(pressure: number) {
  const lockout = tuning.lockout;
  const base = Math.max(0, Math.round(lockout.labRequestsBase));
  const bonusLow = Math.max(0, Math.round(lockout.pressureBonusLow));
  const bonusHigh = Math.max(0, Math.round(lockout.pressureBonusHigh));
  const thresholdLow = Math.max(0, lockout.pressureThresholdLow);
  const thresholdHigh = Math.max(thresholdLow, lockout.pressureThresholdHigh);
  if (pressure >= thresholdHigh) {
    return base + bonusHigh;
  }
  if (pressure >= thresholdLow) {
    return base + bonusLow;
  }
  return base;
}

export function getLockoutLabRequestsBase() {
  return Math.max(0, Math.round(tuning.lockout.labRequestsBase));
}
