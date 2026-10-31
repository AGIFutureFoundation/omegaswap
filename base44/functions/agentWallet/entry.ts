import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { Keypair } from 'npm:@solana/web3.js@1.98.0';
import bs58 from 'npm:bs58@5.0.0';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { action } = await req.json().catch(() => ({}));

    if (action === 'generate') {
      // Returned once and never stored. The admin saves it in Secrets.
      const kp = Keypair.generate();
      return Response.json({ address: kp.publicKey.toBase58(), private_key: bs58.encode(kp.secretKey) });
    }

    const pk = secrets.get('SOLANA_WALLET_PRIVATE_KEY');
    const payout = secrets.get('AGENT_PAYOUT_ADDRESS');
    let address = null;
    if (pk) address = Keypair.fromSecretKey(bs58.decode(pk)).publicKey.toBase58();
    return Response.json({ keyConfigured: !!pk, payoutConfigured: !!payout, address, payout: payout || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}