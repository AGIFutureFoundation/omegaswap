export const CHAINS = ['solana', 'base', 'polygon', 'arbitrum', 'ethereum'];

// Returns a map of agent name -> { chain, address } from the AgentWallet entity.
export async function loadWallets(sr) {
  const { items } = await sr.entities.AgentWallet.list({ sort: '-created_date', limit: 100 });
  const map = {};
  for (const w of items) if (!map[w.agent]) map[w.agent] = { chain: w.chain, address: w.address };
  return map;
}

// Wallet for an agent; unknown agents use the default Solana treasury.
export function walletFor(map, agent) {
  return map[agent] || { chain: 'solana', address: null };
}