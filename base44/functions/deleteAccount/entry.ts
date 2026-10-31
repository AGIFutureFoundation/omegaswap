import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Deletes the signed-in user's own data, then the user record itself.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const owned = ['GiftCard', 'Trade', 'LinkedApp', 'TeamAgent', 'TeamRun', 'AgentPayment'];
    await Promise.all(
      owned.map((name) => base44.asServiceRole.entities[name].deleteMany({ created_by_id: user.id })),
    );
    await base44.asServiceRole.entities.User.delete(user.id);

    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}