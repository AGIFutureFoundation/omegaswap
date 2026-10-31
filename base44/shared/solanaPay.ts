import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from 'npm:@solana/web3.js@1.98.0';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from 'npm:@solana/spl-token@0.4.9';
import bs58 from 'npm:bs58@5.0.0';
import { secrets } from 'base44:runtime';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const DECIMALS = 6;
const MAX_PER_TRANSFER_USD = 1;

export function solanaConfigured(): boolean {
  return !!(secrets.get('SOLANA_WALLET_PRIVATE_KEY') && secrets.get('AGENT_PAYOUT_ADDRESS'));
}

// Sends USDC from the platform wallet to the agent treasury. Returns the transaction signature.
export async function sendUsdc(amountUsd: number, toAddress?: string): Promise<string> {
  if (!(amountUsd > 0) || amountUsd > MAX_PER_TRANSFER_USD) throw new Error('Transfer amount out of range');
  const payer = Keypair.fromSecretKey(bs58.decode(secrets.get('SOLANA_WALLET_PRIVATE_KEY')));
  const to = new PublicKey(toAddress || secrets.get('AGENT_PAYOUT_ADDRESS'));
  const mint = new PublicKey(USDC_MINT);
  const connection = new Connection(secrets.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com', 'confirmed');

  const fromAta = await getAssociatedTokenAddress(mint, payer.publicKey);
  const toAta = await getAssociatedTokenAddress(mint, to, true);
  const units = BigInt(Math.round(amountUsd * 10 ** DECIMALS));

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, toAta, to, mint),
    createTransferCheckedInstruction(fromAta, mint, toAta, payer.publicKey, units, DECIMALS),
  );
  return await sendAndConfirmTransaction(connection, tx, [payer]);
}