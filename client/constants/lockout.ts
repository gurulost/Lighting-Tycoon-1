import { getTuning } from "@/lib/tuning";

const tuning = getTuning();

export function getLockoutLabRequestTarget(pressure: number) {
  const lockout = tuning.lockout;
  if (pressure >= lockout.pressureThresholdHigh) {
    return lockout.labRequestsBase + lockout.pressureBonusHigh;
  }
  if (pressure >= lockout.pressureThresholdLow) {
    return lockout.labRequestsBase + lockout.pressureBonusLow;
  }
  return lockout.labRequestsBase;
}

export function getLockoutLabRequestsBase() {
  return tuning.lockout.labRequestsBase;
}
