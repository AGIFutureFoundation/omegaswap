import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const llm = base44.asServiceRole.integrations.Core;

    if (body.action === 'generate') {
      const role = String(body.role || '').slice(0, 300);
      if (!role) return Response.json({ error: 'role is required' }, { status: 400 });
      const metaprompt = await llm.InvokeLLM({
        prompt: `Write a precise system prompt (metaprompt) for an AI agent on a gift card arbitrage trading team. Role: ${role}. Include: mission, inputs it receives, step-by-step method, hard rules (never invent prices, flag uncertainty), and a structured output format. Under 220 words. Return only the prompt text.`,
      });
      return Response.json({ metaprompt });
    }

    if (body.action === 'run') {
      const task = String(body.task || '').slice(0, 2000);
      if (!body.agent_id || !task) return Response.json({ error: 'agent_id and task are required' }, { status: 400 });
      const agent = await base44.entities.TeamAgent.get(body.agent_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 });
      const cards = (await base44.entities.GiftCard.filter({ created_by_id: user.id }, { limit: 50 })).items;
      const context = cards.map((c) => `${c.brand}: $${c.balance}`).join('; ') || 'no cards';
      const output = await llm.InvokeLLM({
        prompt: `${agent.metaprompt}\n\nUser wallet: ${context}\n\nTask: ${task}`,
      });
      await base44.entities.TeamRun.create({ agent_id: agent.id, agent_name: agent.name, task, output: String(output) });
      return Response.json({ output });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}