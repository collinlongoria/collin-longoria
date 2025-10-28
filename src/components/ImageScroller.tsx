import React, { useEffect, useRef, useState } from 'react';

interface ImageScrollerProps {
    images: string[];
    altTexts?: string[];
    fade?: number; // px
}

export default function ImageScroller({ images, altTexts = [], fade = 24 }: ImageScrollerProps){
    const [selected, setSelected] = useState<string | null>(null);

    const ref = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState(false);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const update = () => {
        const el = ref.current; if (!el) return;
        const c = el.clientWidth, s = el.scrollWidth, left = el.scrollLeft;
        setCanScroll(s > c + 1);
        setAtStart(left <= 1);
        setAtEnd(left >= s - c - 1);
    };

    useEffect(() => {
        update();
        const el = ref.current;
        const onScroll = () => update();
        const onResize = () => update();
        el?.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            el?.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    const fw = `${fade}px`;
    const mask =
        !canScroll ? 'none' :
            atStart ? `linear-gradient(to right, black 0, black calc(100% - ${fw}), transparent 100%)` :
                atEnd   ? `linear-gradient(to right, transparent 0, black ${fw}, black 100%)` :
                    `linear-gradient(to right, transparent 0, black ${fw}, black calc(100% - ${fw}), transparent 100%)`;

    return (
        <>
            <div
                ref={ref}
                className="overflow-x-auto whitespace-nowrap flex gap-4 px-4 py-2 overscroll-x-contain overscroll-y-auto"
                style={{ WebkitMaskImage: mask as any, maskImage: mask as any }}
            >
                {images.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={altTexts[i] || `image-${i}`}
                        className="h-48 flex-none rounded-xl object-cover border border-primary/30 cursor-pointer hover:scale-[1.02] transition-transform"
                        loading="lazy"
                        onClick={() => setSelected(src)}
                    />
                ))}
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
                    onClick={() => setSelected(null)}
                >
                    <img
                        src={selected}
                        alt="Preview"
                        className="max-w-[90%] max-h-[90%] rounded-lg border border-primary/30 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 text-white text-3xl leading-none"
                        aria-label="Close"
                        onClick={() => setSelected(null)}
                    >
                        x
                    </button>
                </div>
            )}
        </>
    );
}
