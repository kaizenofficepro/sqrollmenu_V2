'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// We no longer need ScrollTrigger — animation is driven by the parent's progress prop.

interface CanvasSequenceProps {
    urls: string[];
    scrubSmoothness: number; // 0 = instant, >0 = smoothed duration in seconds
    isMobilePreview?: boolean;
    /** 0–1 value controlled by the parent's scrubber */
    progress: number;
}

export function CanvasSequence({
    urls,
    scrubSmoothness,
    isMobilePreview = false,
    progress,
}: CanvasSequenceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isPreloading, setIsPreloading] = useState(true);
    const [preloadProgress, setPreloadProgress] = useState(0);

    // Internal animated frame tracker – smoothed by scrubSmoothness
    const frameObj = useRef({ frame: 0 });
    const tweenRef = useRef<gsap.core.Tween | null>(null);

    // ── Preload all images once ───────────────────────────────────────────────
    useEffect(() => {
        setIsPreloading(true);
        setPreloadProgress(0);
        let loadedCount = 0;
        const imgArray: HTMLImageElement[] = [];

        const preload = async () => {
            const promises = urls.map((url, i) =>
                new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        imgArray[i] = img;
                        loadedCount++;
                        setPreloadProgress(Math.round((loadedCount / urls.length) * 100));
                        resolve();
                    };
                    img.onerror = reject;
                })
            );

            try {
                await Promise.all(promises);
                setImages(imgArray);
            } catch (err) {
                console.error('Failed to preload some images', err);
            } finally {
                setIsPreloading(false);
            }
        };

        if (urls.length > 0) preload();
    }, [urls]);

    // ── Canvas drawing helper ─────────────────────────────────────────────────
    const drawFrame = (index: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = images[Math.round(index)];
        if (!canvas || !ctx || !img) return;

        if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // Draw first frame when images finish loading
    useEffect(() => {
        if (images.length > 0 && !isPreloading) drawFrame(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images, isPreloading]);

    // ── React to parent progress prop ─────────────────────────────────────────
    useEffect(() => {
        if (images.length === 0 || isPreloading) return;

        const targetFrame = progress * (images.length - 1);

        // Kill any running tween so we don't stack up animations
        if (tweenRef.current) tweenRef.current.kill();

        if (scrubSmoothness === 0) {
            // Instant — draw directly
            frameObj.current.frame = targetFrame;
            drawFrame(Math.round(targetFrame));
        } else {
            // Smoothed — tween the internal frame counter
            tweenRef.current = gsap.to(frameObj.current, {
                frame: targetFrame,
                duration: scrubSmoothness,
                ease: 'power1.out',
                onUpdate: () => {
                    requestAnimationFrame(() => drawFrame(frameObj.current.frame));
                },
            });
        }

        return () => {
            tweenRef.current?.kill();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress, images, isPreloading, scrubSmoothness]);

    if (urls.length === 0) return null;

    return (
        <div
            className={clsx(
                'relative overflow-hidden flex-shrink-0 transition-all duration-500',
                isMobilePreview
                    ? 'h-full max-h-[85vh] aspect-[375/812] bg-zinc-900 rounded-[3rem] shadow-2xl border-[12px] border-zinc-950 ring-1 ring-white/10'
                    : 'w-full h-full'
            )}
        >
            {/* Dynamic Island / Notch */}
            {isMobilePreview && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-6 bg-zinc-950 rounded-b-2xl z-40 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                </div>
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
                <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
        </div>
    );
}
