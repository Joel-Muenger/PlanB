import { useCallback, useEffect, useRef, useState } from 'react';
import { AD_TICK_MS, adProgress, type AdSpot } from '../lib/ads';

interface Props {
  ads: readonly AdSpot[];
  /** Wird aufgerufen, wenn alle Anzeigen gelaufen oder übersprungen sind. */
  onFinish: () => void;
}

/**
 * Vollbild-Werbeblock: Anzeigen laufen nacheinander, jede ist ab
 * `skipOffsetSec` überspringbar. Die dunkle Werbefläche nutzt bewusst
 * keine Projektfarben.
 */
export default function AdOverlay({ ads, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ad = ads[index];
  const progress = ad ? adProgress(elapsed, ad.durationSec, ad.skipOffsetSec) : null;
  const durationSec = ad?.durationSec ?? 0;

  const next = useCallback(() => {
    if (index + 1 < ads.length) {
      setElapsed(0);
      setIndex(index + 1);
    } else {
      onFinish();
    }
  }, [index, ads.length, onFinish]);

  // Zeitgeber pro Anzeige; am Ende automatisch zur nächsten.
  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - start) / 1000;
      if (seconds >= durationSec) {
        window.clearInterval(timer);
        next();
      } else {
        setElapsed(seconds);
      }
    }, AD_TICK_MS);
    return () => window.clearInterval(timer);
  }, [durationSec, next]);

  // Hintergrund während der Werbung nicht scrollen lassen.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !ad) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let angle = 0;
    let frame = 0;
    const render = () => {
      angle += 0.02;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        width * 0.8,
      );
      grad.addColorStop(0, `${ad.themeColor}66`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2 - 40);
      ctx.rotate(Math.sin(angle * 0.8) * 0.04);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-120, -180, 240, 360, 24);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '60px sans-serif';
      ctx.fillText(ad.icon, 0, -40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(ad.title, 0, 50);
      ctx.restore();
      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [ad]);

  if (!ad || !progress) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Werbung"
      className="fixed inset-0 z-[5000] flex select-none flex-col justify-between overflow-hidden bg-black text-white"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

      <header className="relative flex items-center justify-between bg-gradient-to-b from-black/85 to-transparent px-4 pb-3 pt-[calc(env(safe-area-inset-top)+3.5rem)]">
        <span className="rounded-full border border-white/20 bg-neutral-900/75 px-2.5 py-1 text-xs text-neutral-200 backdrop-blur">
          Anzeige {index + 1} von {ads.length}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={!progress.canSkip}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition ${
            progress.canSkip
              ? 'cursor-pointer border-white bg-white text-neutral-900 shadow-[0_2px_10px_rgba(255,255,255,0.4)]'
              : 'cursor-not-allowed border-white/20 bg-neutral-900/75 text-neutral-300'
          }`}
        >
          <span aria-hidden="true">{progress.canSkip ? '⏭' : '⏳'}</span>
          {progress.canSkip ? 'Überspringen' : `Überspringen in ${progress.secondsToSkip}s`}
        </button>
      </header>

      <footer className="relative flex flex-col gap-3 bg-gradient-to-t from-black/90 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/90 p-3 backdrop-blur-xl">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-2xl"
          >
            {ad.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{ad.title}</p>
            <p className="mt-0.5 text-xs text-neutral-400">{ad.subtitle}</p>
          </div>
          <button
            type="button"
            style={{ backgroundColor: ad.themeColor }}
            onClick={() => ad.ctaUrl && window.open(ad.ctaUrl, '_blank', 'noreferrer')}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            {ad.ctaText}
          </button>
        </div>
        <div className="h-[3px] overflow-hidden rounded bg-white/20">
          <div
            className="h-full bg-brand transition-[width] duration-100 ease-linear"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
