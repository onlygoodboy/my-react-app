import { useMemo, useState } from 'react';
import { LoaderCircle, Send, Sparkles, User, WandSparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import Live2DCharacter from './Live2DCharacter';
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
  '帮我生成一个新的二次元角色草案，能直接录入到当前角色库。',
  '分析当前角色的流水与热度表现，给我结论和后续建议。',
  '对最近上线角色的首周流水做复盘，告诉我谁跑得更强以及原因。',
];

const AMIYA_NAME = '阿米娅';
const AMIYA_TITLE = '罗德岛 Live2D 助手';
const AMIYA_PORTRAIT =
  'https://jthwds.oss-cn-hangzhou.aliyuncs.com/characters/5-amiya/illustration/o8ckif3rqc1ssxvv5cmrmcj3y9p4b1t.png';

export default function AiAssistant({
  characters,
  selectedCharacter,
  onCreateCharacter,
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [compactModelVersion, setCompactModelVersion] = useState(0);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '我是阿米娅。你可以直接让我补角色资料、生成新角色草案，或者分析角色流水和版本表现。',
    },
  ]);

  const assistantAvatar = useMemo(() => AMIYA_PORTRAIT, []);
  const assistantContext = selectedCharacter ? `当前关注角色：${selectedCharacter.name}` : '当前未指定角色';

  const openAssistant = () => {
    setIsOpen(true);
  };

  const closeAssistant = () => {
    setIsOpen(false);
    window.setTimeout(() => {
      setCompactModelVersion((current) => current + 1);
    }, 80);
  };

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
        throw new Error(payload.error || 'AI 助手暂时无法响应');
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
      const message = error instanceof Error ? error.message : '请求失败';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `处理这条请求时出了点问题：${message}`,
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
        <div className="fixed inset-0 z-[90] bg-slate-950/28 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 flex w-full justify-end">
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.25 }}
              className="flex h-full w-full max-w-[1120px] overflow-hidden border-l border-white/40 bg-white/96 shadow-2xl"
            >
              <div className="hidden w-[410px] shrink-0 border-r border-indigo-100 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_transparent_52%),linear-gradient(180deg,#eef2ff_0%,#fdf2f8_56%,#ffffff_100%)] p-8 lg:flex">
                <Live2DCharacter name={AMIYA_NAME} title={AMIYA_TITLE} fallbackImage={assistantAvatar} />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-indigo-100 bg-[linear-gradient(180deg,#eef2ff_0%,#fdf2f8_100%)]">
                      <img
                        src={assistantAvatar}
                        alt="Amiya avatar"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-indigo-600 p-1 text-white">
                        <Sparkles size={10} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{AMIYA_NAME}</div>
                      <div className="text-xs text-slate-500">{assistantContext}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeAssistant}
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
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#eef2ff_0%,#fdf2f8_100%)] text-indigo-600">
                          <Sparkles size={16} />
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm',
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-100 bg-slate-50 text-slate-700',
                        )}
                      >
                        {message.content}
                      </div>

                      {message.role === 'user' && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <LoaderCircle size={16} className="animate-spin" />
                      阿米娅正在整理数据和上下文。
                    </div>
                  )}

                  {lastStructuredReply?.analysis && (
                    <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <WandSparkles size={16} className="text-indigo-600" />
                        分析结论
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
                            后续建议
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
                    <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm">
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
                          加入角色库
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="rounded-xl bg-white px-3 py-2">
                          定位：{lastStructuredReply.characterDraft.position || '-'}
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2">
                          武器：{lastStructuredReply.characterDraft.weaponType || '-'}
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2">
                          稀有度：{lastStructuredReply.characterDraft.rarity || 'SSR'}
                        </div>
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
                      className="min-h-[88px] flex-1 resize-none rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
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
            </motion.div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[85] flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={openAssistant}
          className="group flex flex-col items-center gap-2 rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.98))] px-3 py-3 text-left shadow-[0_24px_60px_rgba(79,70,229,0.18)] ring-1 ring-indigo-100/60 backdrop-blur transition-transform hover:-translate-y-0.5"
        >
          <div key={`compact-live2d-${compactModelVersion}`} className="h-[236px] w-[168px] shrink-0">
            <Live2DCharacter name={AMIYA_NAME} title={AMIYA_TITLE} fallbackImage={assistantAvatar} compact />
          </div>

          <div className="w-full px-1 pb-1 text-center">
            <div className="text-sm font-black text-slate-900">{AMIYA_NAME}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">点击展开 Live2D 助手</div>
            <div className="mt-2 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
              常驻在线
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
