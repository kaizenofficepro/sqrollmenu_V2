'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(useGSAP);

interface CanvasSequenceProps {
    urls: string[];
    scrollDistance: number; // e.g., 200 (vh)
    scrubSmoothness: number; // e.g., 0.5
    isPinning: boolean;
    isMobilePreview?: boolean;
    scrollerId?: string; // Optional ID for the specific scroll container
}

export function CanvasSequence({
    urls,
    scrollDistance,
    scrubSmoothness,
    isPinning,
    isMobilePreview = false,
    scrollerId,
}: CanvasSequenceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isPreloading, setIsPreloading] = useState(true);
    const [preloadProgress, setPreloadProgress] = useState(0);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressTextRef = useRef<HTMLDivElement>(null);

    // Preload images
    useEffect(() => {
        setIsPreloading(true);
        setPreloadProgress(0);
        let loadedCount = 0;
        const imgArray: HTMLImageElement[] = [];

        const preload = async () => {
            const promises = urls.map((url, i) => {
                return new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        imgArray[i] = img;
                        loadedCount++;
                        setPreloadProgress(Math.round((loadedCount / urls.length) * 100));
                        resolve();
                    };
                    img.onerror = reject;
                });
            });

            try {
                await Promise.all(promises);
                setImages(imgArray);
            } catch (error) {
                console.error("Failed to preload some images", error);
            } finally {
                setIsPreloading(false);
            }
        };

        if (urls.length > 0) {
            preload();
        }
    }, [urls]);

    // Canvas drawing function
    const drawFrame = (index: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = images[index];

        if (!canvas || !ctx || !img) return;

        // Set canvas internal resolution to match image
        if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image covering the canvas (though aspect ratio matches because we set width/height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // Draw first frame when images load
    useEffect(() => {
        if (images.length > 0 && !isPreloading) {
            drawFrame(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images, isPreloading]);

    // GSAP ScrollTrigger Sequence Setup
    useGSAP(
        () => {
            if (images.length === 0 || isPreloading) return;

            const frameCount = images.length;
            const sequence = { frame: 0 };

            const trigger = ScrollTrigger.create({
                trigger: containerRef.current,
                scroller: scrollerId ? document.querySelector(scrollerId) : window, // Explicitly query as useGSAP scope restricts string selectors
                start: 'top top',
                end: `+=${scrollDistance}vh`,
                pin: isPinning,
                scrub: scrubSmoothness === 0 ? true : scrubSmoothness,
                // markers: true, // Removed default bleeding markers
                onUpdate: (self) => {
                    const progressPct = self.progress * 100;
                    if (progressBarRef.current) {
                        progressBarRef.current.style.height = `${progressPct}%`;
                    }
                    if (progressTextRef.current) {
                        progressTextRef.current.innerText = `${Math.round(progressPct)}%`;
                        progressTextRef.current.style.top = `${progressPct}%`;
                    }
                },
                animation: gsap.to(sequence, {
                    frame: frameCount - 1,
                    snap: 'frame',
                    ease: 'none',
                    onUpdate: () => {
                        requestAnimationFrame(() => drawFrame(Math.round(sequence.frame)));
                    },
                }),
            });

            return () => {
                trigger.kill();
            };
        },
        { dependencies: [images, isPreloading, scrollDistance, scrubSmoothness, isPinning], scope: containerRef }
    );

    if (urls.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="relative w-full bg-black overflow-hidden flex items-center justify-center p-4 lg:p-8"
            style={{
                // We fake the scroll height if pinning is disabled so the scrollbar still exists
                height: isPinning ? '100vh' : `${scrollDistance}vh`
            }}
        >
            {/* --- Phone Mockup Container if Mobile Mode --- */}
            <div className={clsx(
                "relative transition-all duration-500 overflow-hidden",
                isMobilePreview
                    ? "h-full max-h-[85vh] aspect-[375/812] bg-zinc-900 rounded-[3rem] shadow-[-20px_0_30px_-10px_rgba(0,0,0,0.5)] border-[12px] border-zinc-950 ring-1 ring-white/10 flex-shrink-0"
                    : "w-full h-full"
            )}>
                {isMobilePreview && (
                    <>
                        {/* Dynamic Island / iPhone Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-6 bg-zinc-950 rounded-b-2xl z-40 flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                            <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                        </div>
                    </>
                )}

                {isPreloading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
                        <Loader2 className="w-12 h-12 text-brand-400 animate-spin mb-4" />
                        <p className="text-xl font-bold text-white">Preloading Frames</p>
                        <p className="text-[var(--text-muted)] mt-2">{preloadProgress}% Complete</p>
                        <div className="w-64 h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-brand-500 transition-all duration-300"
                                style={{ width: `${preloadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Custom Pro-UI Scroll Progress Overlay */}
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 h-[70%] max-h-[600px] w-12 flex flex-col items-center justify-between py-2 z-50 pointer-events-none">

                            <div className="flex flex-col items-center gap-1 mb-3">
                                <span className="text-[9px] font-mono text-emerald-400/90 uppercase tracking-widest font-bold">Scroller Start</span>
                                <div className="w-4 h-px bg-emerald-400/50" />
                                <span className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-wider">Start</span>
                            </div>

                            <div className="relative w-1.5 flex-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                <div
                                    ref={progressBarRef}
                                    className="absolute top-0 left-0 w-full bg-brand-500 rounded-full shadow-[0_0_12px_rgba(91,108,248,1)]"
                                    style={{ height: '0%' }}
                                />
                            </div>

                            {/* Moving Percentage Tag */}
                            <div className="absolute inset-y-12 right-0 w-full h-[calc(100%-6rem)]">
                                <div
                                    ref={progressTextRef}
                                    className="absolute right-6 flex items-center justify-center min-w-[36px] bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-md text-[10px] font-mono font-bold text-white border border-white/10 shadow-lg"
                                    style={{ top: '0%', transform: 'translateY(-50%)' }}
                                >
                                    0%
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-1 mt-3">
                                <span className="text-[9px] font-mono text-red-400/70 uppercase tracking-wider">End</span>
                                <div className="w-4 h-px bg-red-400/50" />
                                <span className="text-[9px] font-mono text-red-400/90 font-bold uppercase tracking-widest">Scroller End</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center w-full h-full pointer-events-none">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full object-cover shadow-2xl transition-all duration-500"
                            />
                        </div>
                    </>
                )}
            </div>
            {/* --- End Phone Mockup --- */}
        </div>
    );
}
