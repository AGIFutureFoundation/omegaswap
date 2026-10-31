// Server-side copy of the pool credit rates (keep in step with src/lib/brands.js)
export const POOL_FEE = 0.015;
export const POOL_RATES: Record<string, number> = {
  Amazon: 1.0,
  Steam: 0.97,
  Starbucks: 0.94,
  'Uber Eats': 0.92,
  Netflix: 0.93,
  Apple: 0.98,
};