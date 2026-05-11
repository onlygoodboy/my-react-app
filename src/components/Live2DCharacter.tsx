import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Sparkles } from 'lucide-react';

declare global {
  interface Window {
    PIXI?: typeof PIXI;
    Live2DCubismCore?: {
      Moc?: {
        fromArrayBuffer?: (buffer: ArrayBuffer) => unknown;
      };
      Version?: unknown;
    };
  }
}

interface Live2DCharacterProps {
  name: string;
  title: string;
  fallbackImage?: string;
  compact?: boolean;
}

type CubismModule = {
  Live2DModel: {
    from: (source: string | Record<string, unknown>) => Promise<any>;
    registerTicker: (ticker: typeof PIXI.Ticker) => void;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const LIVE2D_MODEL_URL =
  'https://jthwds.oss-cn-hangzhou.aliyuncs.com/amy/amy%281%29.model3.json';
const LIVE2D_MODEL_SOURCE = {
  url: LIVE2D_MODEL_URL,
  Version: 3,
  FileReferences: {
    Moc: 'amy(1).moc3',
    Textures: ['amy(1).8192/texture_00.png'],
    Physics: 'amy(1).physics3.json',
    DisplayInfo: 'amy(1).cdi3.json',
  },
  Groups: [
    {
      Target: 'Parameter',
      Name: 'LipSync',
      Ids: [],
    },
    {
      Target: 'Parameter',
      Name: 'EyeBlink',
      Ids: [],
    },
  ],
};

const ensureCubismCoreScript = async () => {
  const isReady = () =>
    typeof window.Live2DCubismCore?.Moc?.fromArrayBuffer === 'function' &&
    window.Live2DCubismCore?.Version !== undefined;

  const waitForReady = async () => {
    const startedAt = Date.now();

    while (!isReady()) {
      if (Date.now() - startedAt > 5000) {
        const availableKeys = Object.keys(window.Live2DCubismCore ?? {}).join(', ') || 'none';
        throw new Error(`Live2D core 未完成初始化，当前字段: ${availableKeys}`);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  };

  if (isReady()) return;

  const existing = document.querySelector<HTMLScriptElement>('script[data-live2d-core="true"]');
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      if (isReady()) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Live2D core script failed to load.')), {
        once: true,
      });
    });

    await waitForReady();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/live2d/live2dcubismcore.min.js';
    script.async = true;
    script.dataset.live2dCore = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Live2D core script failed to load.'));
    document.head.appendChild(script);
  });

  await waitForReady();
};

export default function Live2DCharacter({
  name,
  title,
  fallbackImage,
  compact = false,
}: Live2DCharacterProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugMessage, setDebugMessage] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let destroyed = false;
    let model: any = null;
    let app: PIXI.Application | null = null;
    let targetX = 0;
    let targetY = 0;
    let targetRotation = 0;
    let baseX = 0;
    let baseY = 0;
    let baseScale = 1;
    let tickerTime = 0;
    let disposeEvents: (() => void) | undefined;

    const syncModelLayout = () => {
      if (!host || !model) return;

      const width = host.clientWidth;
      const height = host.clientHeight;
      const localBounds = model.getLocalBounds?.();
      const sourceWidth =
        typeof localBounds?.width === 'number' && localBounds.width > 1 ? localBounds.width : 800;
      const sourceHeight =
        typeof localBounds?.height === 'number' && localBounds.height > 1 ? localBounds.height : 1200;

      if (compact) {
        baseScale = clamp(Math.min(width / sourceWidth, height / sourceHeight) * 0.94, 0.016, 0.3);
        baseX = width * 0.5;
        baseY = height * 0.54;
      } else {
        baseScale = clamp(Math.min(width / sourceWidth, height / sourceHeight) * 0.68, 0.07, 0.9);
        baseX = width * 0.5;
        baseY = height * 0.58;
      }
      targetX = baseX;
      targetY = baseY;

      model.anchor.set(0.5, 0.5);
      model.scale.set(baseScale);
      model.x = baseX;
      model.y = baseY;

      setDebugMessage(
        `bounds ${Math.round(sourceWidth)}x${Math.round(sourceHeight)} | scale ${baseScale.toFixed(3)} | host ${width}x${height}`,
      );
    };

    const boot = async () => {
      setStatus('loading');
      setErrorMessage('');
      setDebugMessage('');

      await ensureCubismCoreScript();
      if (typeof window.Live2DCubismCore?.Moc?.fromArrayBuffer !== 'function') {
        const availableKeys = Object.keys(window.Live2DCubismCore ?? {}).join(', ') || 'none';
        throw new Error(`Live2D core runtime invalid. keys=${availableKeys}`);
      }

      window.PIXI = PIXI;

      const cubismModule = (await import('pixi-live2d-display/cubism4')) as CubismModule;
      const { Live2DModel } = cubismModule;
      Live2DModel.registerTicker(PIXI.Ticker);

      app = new PIXI.Application({
        view: canvas,
        resizeTo: host,
        autoDensity: true,
        antialias: true,
        backgroundAlpha: 0,
      });

      model = await Live2DModel.from(LIVE2D_MODEL_SOURCE);
      if (destroyed) {
        model.destroy?.();
        app.destroy(true, { children: true, texture: false, baseTexture: false });
        return;
      }

      model.autoUpdate = true;
      model.visible = true;
      model.alpha = 1;
      model.cacheAsBitmap = false;

      app.stage.addChild(model);
      app.stage.sortableChildren = true;
      app.stage.interactiveChildren = true;

      syncModelLayout();
      app.render();

      window.setTimeout(() => {
        if (!destroyed) {
          syncModelLayout();
          app?.render();
        }
      }, 60);

      setStatus('ready');

      app.ticker.add((delta) => {
        if (!model) return;

        tickerTime += delta / 60;
        const floatOffset = Math.sin(tickerTime * 1.7) * 5;
        const swayOffset = Math.sin(tickerTime * 1.15) * 3;

        model.x += (targetX + swayOffset - model.x) * 0.08;
        model.y += (targetY + floatOffset - model.y) * 0.08;
        model.rotation += (targetRotation - model.rotation) * 0.08;
      });

      const onPointerMove = (event: PointerEvent) => {
        if (!host || !model) return;

        const rect = host.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const nx = x / rect.width - 0.5;
        const ny = y / rect.height - 0.5;

        targetX = baseX + nx * 16;
        targetY = baseY + ny * 10;
        targetRotation = nx * 0.08;
        model.focus(x, y);
      };

      const onPointerLeave = () => {
        if (!host || !model) return;

        targetX = baseX;
        targetY = baseY;
        targetRotation = 0;
        model.focus(host.clientWidth * 0.5, host.clientHeight * 0.42, true);
      };

      const onPointerDown = (event: PointerEvent) => {
        if (!host || !model) return;

        const rect = host.getBoundingClientRect();
        model.tap(event.clientX - rect.left, event.clientY - rect.top);
      };

      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', onPointerLeave);
      host.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('resize', syncModelLayout);

      disposeEvents = () => {
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
        host.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('resize', syncModelLayout);
      };
    };

    void boot().catch((error) => {
      console.error('Live2D boot failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown Live2D error');
    });

    return () => {
      destroyed = true;
      disposeEvents?.();
      model?.destroy?.();
      app?.destroy(true, { children: true, texture: false, baseTexture: false });
    };
  }, []);

  if (compact) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.98))] shadow-[0_20px_50px_rgba(79,70,229,0.18)]">
        <div ref={hostRef} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.98),rgba(224,231,255,0.96)_38%,rgba(196,181,253,0.62)_100%)]">
          <canvas ref={canvasRef} className="h-full w-full" />

          {status !== 'ready' && fallbackImage && (
            <img
              src={fallbackImage}
              alt={`${name} fallback`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-soft-light"
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),transparent)]" />
          <div className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-indigo-600 shadow-sm">
            阿米娅
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-500 shadow-sm">
            <Sparkles size={10} className="text-indigo-500" />
            {status === 'ready' ? 'LIVE' : status === 'loading' ? 'LOADING' : 'FALLBACK'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(238,242,255,0.98))] p-4 shadow-[0_28px_80px_rgba(79,70,229,0.18)]">
      <div className="absolute inset-x-10 top-0 h-20 rounded-b-[42px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),transparent_70%)]" />
      <div
        ref={hostRef}
        className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.98),rgba(224,231,255,0.96)_38%,rgba(196,181,253,0.62)_100%)]"
      >
        <canvas ref={canvasRef} className="h-full w-full" />

        {status !== 'ready' && fallbackImage && (
          <img
            src={fallbackImage}
            alt={`${name} fallback`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-soft-light"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]" />
        <div className="pointer-events-none absolute inset-x-[18%] bottom-[8%] h-10 rounded-full bg-indigo-950/10 blur-xl" />
        <div className="absolute left-4 top-4 rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold text-indigo-600 shadow-sm">
          Cubism
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
          <Sparkles size={12} className="text-indigo-500" />
          {status === 'ready' ? 'LIVE' : status === 'loading' ? 'LOADING' : 'FALLBACK'}
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-lg shadow-indigo-100/60 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-slate-900">{name}</div>
            <div className="mt-1 text-sm text-slate-500">{title}</div>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            {status === 'ready' ? 'ONLINE' : status === 'loading' ? 'BOOTING' : 'FALLBACK'}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {status === 'error'
            ? `Live2D 启动失败：${errorMessage || '未知错误'}`
            : '已接入本地 Cubism 模型，支持光标跟随、轻微浮动和点击交互。'}
        </p>

        {status === 'ready' && debugMessage && (
          <p className="mt-2 text-[11px] text-slate-400">{debugMessage}</p>
        )}
      </div>
    </div>
  );
}
