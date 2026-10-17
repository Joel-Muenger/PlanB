import { forwardRef, useEffect, useState } from 'react';

// Masse eines iPhone 15 Pro in CSS-Pixeln.
const SCREEN_W = 393;
const SCREEN_H = 852;
const BEZEL = 12;
const DEVICE_H = SCREEN_H + 2 * BEZEL;

function useFitScale() {
  const compute = () => Math.min(1, (window.innerHeight - 110) / DEVICE_H);
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

/**
 * Zeigt die App in einem iPhone-Rahmen. Als iframe, damit die Tailwind-Breakpoints
 * (sm, lg) wie auf einem echten Gerät greifen. Statusleiste, Dynamic Island und
 * Home-Indikator liegen über dem iframe; die App reserviert dafür die Safe Areas.
 */
const PhonePreview = forwardRef<HTMLIFrameElement, { src: string }>(function PhonePreview(
  { src },
  ref,
) {
  const scale = useFitScale();

  return (
    <div className="flex justify-center pb-6" style={{ height: DEVICE_H * scale + 24 }}>
      <div
        className="relative origin-top"
        style={{ width: SCREEN_W + 2 * BEZEL, height: DEVICE_H, transform: `scale(${scale})` }}
      >
        {/* Seitentasten */}
        <span className="absolute -left-[3px] top-[118px] h-8 w-[3px] rounded-l bg-[#2b2b33]" />
        <span className="absolute -left-[3px] top-[178px] h-[62px] w-[3px] rounded-l bg-[#2b2b33]" />
        <span className="absolute -left-[3px] top-[252px] h-[62px] w-[3px] rounded-l bg-[#2b2b33]" />
        <span className="absolute -right-[3px] top-[210px] h-[96px] w-[3px] rounded-r bg-[#2b2b33]" />

        <div className="h-full w-full rounded-[64px] bg-[#1c1c22] p-[12px] shadow-[0_24px_60px_rgba(16,42,67,0.25),inset_0_0_0_2px_#3a3a44]">
          <div className="relative h-full w-full overflow-hidden rounded-[52px] bg-sand">
            <iframe
              ref={ref}
              src={src}
              title="iPhone-Ansicht von Plan B"
              className="block h-full w-full border-0"
            />

            {/* Statusleiste mit Dynamic Island */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[54px] items-center justify-between bg-sand/90 px-8 pt-1 text-[15px] font-semibold text-black backdrop-blur">
              <span className="w-12 text-center">9:41</span>
              <span className="absolute left-1/2 top-[11px] h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />
              <span className="flex w-12 items-center justify-end gap-1">
                <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden>
                  <rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" />
                  <rect x="4.5" y="5" width="3" height="6" rx="1" fill="currentColor" />
                  <rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" />
                  <rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" />
                </svg>
                <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden>
                  <rect
                    x="0.5"
                    y="0.5"
                    width="21"
                    height="11"
                    rx="3"
                    fill="none"
                    stroke="currentColor"
                    opacity="0.4"
                  />
                  <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
                  <rect x="23" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" />
                </svg>
              </span>
            </div>

            {/* Home-Indikator */}
            <span className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black/80" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default PhonePreview;
