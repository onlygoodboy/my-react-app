import { useMemo, useState } from 'react';
import { Bot, LoaderCircle, Send, Sparkles, User, WandSparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { AIAssistantResponse, AICharacterDraft, Character } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  payload?: AIAssistantResponse;
}

interface AiAssistantProps {
  characters: Character[];
  selectedCharacter?: Character | null;
  onCreateCharacter: (draft: AICharacterDraft) => void;
}

const QUICK_PROMPTS = [
  '帮我生成一个新角色草案，风格偏二次元，适合这个站点录入。',
  '分析一下当前角色的流水和热度表现，给我结论和后续建议。',
  '对比最近已上线角色的首周流水，告诉我谁更强以及原因。',
];

export default function AiAssistant({
  characters,
  selectedCharacter,
  onCreateCharacter,
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '我是澪，可以帮你生成新角色资料，也可以结合当前角色库分析流水、热度和版本表现。',
    },
  ]);

  const assistantAvatar = useMemo(
    () => selectedCharacter?.assets?.portrait || characters[0]?.assets?.portrait,
    [characters, selectedCharacter],
  );

  const submitPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          history: nextMessages.slice(-6).map(({ role, content }) => ({ role, content })),
          characters,
          selectedCharacter,
        }),
      });

      const payload = (await response.json()) as AIAssistantResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'AI 助手暂时不可用');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: payload.reply,
          payload,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败，请稍后重试';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `这次调用没成功：${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const lastStructuredReply = [...messages].reverse().find((item) => item.payload)?.payload;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-[90] flex w-full justify-end bg-slate-950/20 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-indigo-100 bg-indigo-50">
                  {assistantAvatar ? (
                    <img
                      src={assistantAvatar}
                      alt="AI assistant avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-indigo-600">
                      <Bot size={20} />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-indigo-600 p-1 text-white">
                    <Sparkles size={10} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">澪 AI 助手</div>
                  <div className="text-xs text-slate-500">
                    {selectedCharacter ? `当前聚焦：${selectedCharacter.name}` : '可生成角色草案 / 分析流水'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-slate-100 px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submitPrompt(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {message.role === 'assistant' && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm',
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-100 bg-slate-50 text-slate-700',
                    )}
                  >
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <LoaderCircle size={16} className="animate-spin" />
                  正在调用 DeepSeek 生成结果…
                </div>
              )}

              {lastStructuredReply?.analysis && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <WandSparkles size={16} className="text-indigo-600" />
                    分析结果
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{lastStructuredReply.analysis.summary}</p>
                  {lastStructuredReply.analysis.highlights.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {lastStructuredReply.analysis.highlights.map((item) => (
                        <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                  {lastStructuredReply.analysis.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        建议动作
                      </div>
                      <div className="space-y-2">
                        {lastStructuredReply.analysis.recommendations.map((item) => (
                          <div key={item} className="text-sm text-slate-600">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lastStructuredReply?.characterDraft && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        新角色草案：{lastStructuredReply.characterDraft.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {lastStructuredReply.characterDraft.game || '未指定游戏'} /{' '}
                        {lastStructuredReply.characterDraft.version || 'v1.0'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCreateCharacter(lastStructuredReply.characterDraft!)}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                      添加到角色库
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="rounded-xl bg-white px-3 py-2">定位：{lastStructuredReply.characterDraft.position || '-'}</div>
                    <div className="rounded-xl bg-white px-3 py-2">武器：{lastStructuredReply.characterDraft.weaponType || '-'}</div>
                    <div className="rounded-xl bg-white px-3 py-2">稀有度：{lastStructuredReply.characterDraft.rarity || 'SSR'}</div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      标签：{lastStructuredReply.characterDraft.tags?.slice(0, 3).join(' / ') || '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  rows={3}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void submitPrompt(input);
                    }
                  }}
                  placeholder="例如：帮我补一个 5 星新角色；分析芙宁娜的首周流水。"
                  className="min-h-[88px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => void submitPrompt(input)}
                  disabled={isLoading || !input.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[85] flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-2xl ring-1 ring-slate-200 transition-transform hover:-translate-y-0.5"
      >
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-indigo-50">
          {assistantAvatar ? (
            <img
              src={assistantAvatar}
              alt="AI assistant trigger avatar"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-indigo-600">
              <Bot size={18} />
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-indigo-600 p-1 text-white">
            <Sparkles size={10} />
          </div>
        </div>
        AI 助手
      </button>
    </>
  );
}
