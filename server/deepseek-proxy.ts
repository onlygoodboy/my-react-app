import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';

dotenv.config();

interface AssistantRequestBody {
  prompt?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  characters?: Array<Record<string, unknown>>;
  selectedCharacter?: Record<string, unknown> | null;
}

const app = express();
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const readJson = (value: unknown) => {
  if (!value || typeof value !== 'object') return {};
  return value as AssistantRequestBody;
};

const summarizeCharacter = (character: Record<string, any>) => ({
  name: character.name,
  company: character.company,
  game: character.game,
  version: character.version,
  rarity: character.rarity,
  position: character.position,
  weaponType: character.weaponType,
  tags: character.tags,
  status: character.status,
  overallProgress: character.overallProgress,
  currentStage: character.currentStage,
  launchTime: character.launchTime,
  performance: character.performance
    ? {
        firstDayRevenue: character.performance.firstDayRevenue,
        firstThreeDaysRevenue: character.performance.firstThreeDaysRevenue,
        firstWeekRevenue: character.performance.firstWeekRevenue,
        peakPopularity: character.performance.peakPopularity,
        rank: character.performance.rank,
      }
    : undefined,
});

const systemPrompt = [
  '你是阿米娅，一个面向游戏角色运营/角色资料管理的 AI 助手。',
  '你要用中文回答，输出严格 JSON，不要输出 Markdown。',
  '{',
  '  "intent": "general" | "create_character" | "analyze_performance",',
  '  "reply": "string",',
  '  "characterDraft": { /* 仅在 create_character 时输出 */ },',
  '  "analysis": { "summary": string, "highlights": string[], "recommendations": string[] }',
  '}',
].join('\n');

app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  if (!apiKey) {
    res.status(500).json({ error: 'Missing DEEPSEEK_API_KEY' });
    return;
  }

  try {
    const body = readJson(req.body);
    const prompt = body.prompt?.trim();
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const history = (body.history || []).slice(-6);
    const characters = (body.characters || []).slice(0, 40).map((item) => summarizeCharacter(item));
    const selectedCharacter = body.selectedCharacter ? summarizeCharacter(body.selectedCharacter) : null;

    const userContext = [
      `用户问题：${prompt}`,
      '',
      `角色库：${JSON.stringify(characters, null, 2)}`,
      '',
      `当前角色：${JSON.stringify(selectedCharacter, null, 2)}`,
    ].join('\n');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((item) => ({ role: item.role, content: item.content })),
          { role: 'user', content: userContext },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: result?.error?.message || 'DeepSeek request failed' });
      return;
    }

    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      res.status(502).json({ error: 'Invalid DeepSeek response' });
      return;
    }

    res.status(200).json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`DeepSeek proxy listening on http://localhost:${port}`);
});
