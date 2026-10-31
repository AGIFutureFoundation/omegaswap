// Indicative rates only. Replace with live rates once a rate feed is connected.
// rate = what the pool credits per $1 of balance; cost = indicative retail price per $1 on Bitrefill.
export const BRANDS = [
  { name: "Amazon", rate: 1.0, cost: 0.99 },
  { name: "Steam", rate: 0.97, cost: 0.94 },
  { name: "Starbucks", rate: 0.94, cost: 0.93 },
  { name: "Uber Eats", rate: 0.92, cost: 0.9 },
  { name: "Netflix", rate: 0.93, cost: 0.95 },
  { name: "Apple", rate: 0.98, cost: 0.97 },
];

export const POOL_FEE = 0.015; // 1.5% pool fee on swaps (your trade profit)
export const AGENT_FEE = 0.001; // 0.1% micro payment to the agent that routed the trade
export const REFERRAL_CODE = "YOUR_REFERRAL_CODE"; // replace with your Bitrefill referral code

export const referralUrl = (brand) =>
  `https://www.bitrefill.com/?ref=${REFERRAL_CODE}&q=${encodeURIComponent(brand)}`;

export const rateOf = (name) => BRANDS.find((b) => b.name === name)?.rate ?? 1;

export const deals = () =>
  BRANDS.map((b) => ({ ...b, spread: ((b.rate - b.cost) / b.cost) * 100 }))
    .filter((d) => d.spread > 0)
    .sort((a, b) => b.spread - a.spread);