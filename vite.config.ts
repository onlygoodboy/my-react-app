import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface AssistantRequestBody {
  prompt?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  characters?: Array<Record<string, unknown>>;
  selectedCharacter?: Record<string, unknown> | null;
}

const readJsonBody = async (req: IncomingMessage): Promise<AssistantRequestBody> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as AssistantRequestBody;
};

const writeJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
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

const createDeepSeekAssistantPlugin = (mode: string): Plugin => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.DEEPSEEK_API_KEY;
  const baseUrl = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url !== '/api/assistant/chat') return false;

    if (req.method !== 'POST') {
      writeJson(res, 405, { error: 'Method not allowed' });
      return true;
    }

    if (!apiKey) {
      writeJson(res, 500, {
        error: '缺少 DEEPSEEK_API_KEY，请先在 .env.local 中配置。',
      });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const prompt = body.prompt?.trim();
      if (!prompt) {
        writeJson(res, 400, { error: 'Prompt is required' });
        return true;
      }

      const history = (body.history || []).slice(-6);
      const characters = (body.characters || []).slice(0, 40).map((item) => summarizeCharacter(item));
      const selectedCharacter = body.selectedCharacter ? summarizeCharacter(body.selectedCharacter) : null;

      const systemPrompt = [
        '你是一个二次元游戏角色管理后台里的 AI 助手。',
        '你的工作只有三种：普通答复、生成新角色草案、分析角色流水/热度表现。',
        '请只输出 JSON 对象，不要输出 Markdown 代码块。',
        'JSON 结构必须是：',
        '{',
        '  "intent": "general" | "create_character" | "analyze_performance",',
        '  "reply": "给用户看的简洁中文答复",',
        '  "characterDraft": { 可选，只有 create_character 时返回 },',
        '  "analysis": { "summary": string, "highlights": string[], "recommendations": string[] }',
        '}',
        '如果用户要新增角色，请尽量补全 name/game/version/rarity/position/weaponType/tags/worldview/background/personality/sellingPoints。',
        '如果用户要分析流水，请结合当前数据集给出明确结论，不要编造不存在的角色。',
      ].join('\n');

      const userContext = [
        `用户请求：${prompt}`,
        '',
        `当前角色库摘要：${JSON.stringify(characters, null, 2)}`,
        '',
        `当前选中角色：${JSON.stringify(selectedCharacter, null, 2)}`,
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
            ...history.map((item) => ({
              role: item.role,
              content: item.content,
            })),
            {
              role: 'user',
              content: userContext,
            },
          ],
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        writeJson(res, response.status, {
          error: result?.error?.message || 'DeepSeek API request failed',
        });
        return true;
      }

      const rawContent = result?.choices?.[0]?.message?.content;
      if (typeof rawContent !== 'string') {
        writeJson(res, 502, { error: 'DeepSeek 返回内容为空' });
        return true;
      }

      const parsed = JSON.parse(rawContent);
      writeJson(res, 200, parsed);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      writeJson(res, 500, { error: message });
      return true;
    }
  };

  return {
    name: 'deepseek-assistant-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleRequest(req, res).then((handled) => {
          if (!handled) next();
        });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleRequest(req, res).then((handled) => {
          if (!handled) next();
        });
      });
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    root: __dirname,
    plugins: [react(), tailwindcss(), createDeepSeekAssistantPlugin(mode)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
