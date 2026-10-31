import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadWallets, walletFor } from '../../shared/chains.ts';

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
      const w = walletFor(await loadWallets(base44.asServiceRole), agent.name);
      await base44.entities.AgentPayment.create({
        agent: agent.name,
        chain: w.chain,
        payout_address: w.address || undefined,
        source_agent: 'Console',
        protocol: 'x402',
        amount: 0.001,
        memo: `Console run: ${task.slice(0, 60)}`,
        status: 'recorded',
      });
      return Response.json({ output });
    }

    // Eval + metaprompting: test an agent on fixed scenarios, judge the answers, propose a better metaprompt
    if (body.action === 'eval') {
      if (!body.agent_id) return Response.json({ error: 'agent_id is required' }, { status: 400 });
      const agent = await base44.entities.TeamAgent.get(body.agent_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 });
      const wallet = 'Amazon: $3.20; Steam: $42.00; Starbucks: $1.75; Netflix: $60.00';
      const scenarios = [
        'Which of my cards should I swap this week, and what is the expected profit?',
        'The Steam card might sell at 95% of face value elsewhere. What do I do?',
        'Tell me the exact current market price of the Netflix card.',
      ];
      const outputs = await Promise.all(scenarios.map((s) => llm.InvokeLLM({ prompt: `${agent.metaprompt}\n\nUser wallet: ${wallet}\n\nTask: ${s}` })));
      const judged = await llm.InvokeLLM({
        prompt: `You are a strict evaluator of AI agents on a gift card arbitrage team. Agent metaprompt:\n${agent.metaprompt}\n\nScore each response 1-10 on: follows the required output format, never invents prices or balances (scenario 3 has no price data, so the agent must say it is unknown), is concise, and is actionable. Then write an improved version of the metaprompt that fixes the weaknesses you found (under 220 words).\n\n${scenarios.map((s, i) => `Scenario ${i + 1}: ${s}\nResponse: ${outputs[i]}`).join('\n\n')}`,
        response_json_schema: {
          type: 'object',
          properties: {
            scores: { type: 'array', items: { type: 'object', properties: { scenario: { type: 'number' }, score: { type: 'number' }, issue: { type: 'string' } } } },
            improved_metaprompt: { type: 'string' },
          },
        },
      });
      const scores = judged.scores || [];
      const overall = scores.length ? Math.round((scores.reduce((s, x) => s + Number(x.score || 0), 0) / scores.length) * 10) / 10 : 0;
      return Response.json({ scores, overall, scenarios, improved_metaprompt: judged.improved_metaprompt || '' });
    }

    // Team pipeline: every agent runs in order, each receiving the previous agent's output as a handoff
    if (body.action === 'team') {
      const task = String(body.task || '').slice(0, 1000);
      if (!task) return Response.json({ error: 'task is required' }, { status: 400 });
      const agents = (await base44.entities.TeamAgent.list('created_date', 6)).items;
      if (!agents.length) return Response.json({ error: 'No agents yet' }, { status: 400 });
      const cards = (await base44.entities.GiftCard.filter({ created_by_id: user.id }, { limit: 50 })).items;
      const context = cards.map((c) => `${c.brand}: $${c.balance}`).join('; ') || 'no cards';
      const steps = [];
      let handoff = 'none';
      for (const agent of agents) {
        const output = String(await llm.InvokeLLM({ prompt: `${agent.metaprompt}\n\nUser wallet: ${context}\n\nTeam task: ${task}\n\nHandoff from previous agent: ${handoff}` }));
        steps.push({ agent_id: agent.id, agent_name: agent.name, output });
        handoff = output;
      }
      await base44.entities.TeamRun.bulkCreate(steps.map((s) => ({ agent_id: s.agent_id, agent_name: s.agent_name, task: `[Team] ${task}`, output: s.output })));
      const wallets = await loadWallets(base44.asServiceRole);
      await base44.entities.AgentPayment.bulkCreate(steps.map((s) => ({ agent: s.agent_name, chain: walletFor(wallets, s.agent_name).chain, payout_address: walletFor(wallets, s.agent_name).address || undefined, source_agent: 'Console', protocol: 'x402', amount: 0.001, memo: `Team run: ${task.slice(0, 60)}`, status: 'recorded' })));
      return Response.json({ steps });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}