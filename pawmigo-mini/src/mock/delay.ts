// Centralized timings so "real-time" simulations are tunable in one place.
export const TIMINGS = {
  fast: 280,
  normal: 600,
  scan: 2200,
  autoAccept: 3200,
  chatReply: 1800,
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Returns true ~rate of the time (0..1). Default 0 keeps demos clean;
// raise locally to exercise error states.
export function maybeFail(rate = 0): boolean {
  return Math.random() < rate
}
