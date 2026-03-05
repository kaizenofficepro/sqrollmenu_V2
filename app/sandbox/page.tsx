'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Lenis from 'lenis';
import { Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
    SandboxLoader,
    CanvasSequence,
    TuningPanel,
    SandboxSettings,
    CodeExport,
} from '@/components/sandbox';

const DEFAULT_SETTINGS: SandboxSettings = {
    scrollDistance: 300,
    scrubSmoothness: 1,
    isPinning: true,
    isMobilePreview: true,
    lenisLerp: 0.1,
    lenisWheelMultiplier: 1,
};

export default function SandboxPage() {
    const [urls, setUrls] = useState<string[]>([]);
    const [settings, setSettings] = useState<SandboxSettings>(DEFAULT_SETTINGS);

    // 0–1 progress that drives the canvas animation
    const [progress, setProgress] = useState(0);

    // Virtual scroller for Lenis (hidden tall div inside a viewport-sized container)
    const lenisScrollerRef = useRef<HTMLDivElement>(null);
    const lenisContentRef = useRef<HTMLDivElement>(null);
    const lenisRef = useRef<Lenis | null>(null);
    const rafRef = useRef<number | null>(null);

    // Scrubber drag refs
    const scrubberRailRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleReset = () => {
        urls.forEach(URL.revokeObjectURL);
        setUrls([]);
        setProgress(0);
        if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    };

    // ── Lenis setup & cleanup ─────────────────────────────────────────────────
    useEffect(() => {
        if (urls.length === 0 || !lenisScrollerRef.current || !lenisContentRef.current) return;

        // Destroy old instance
        if (lenisRef.current) {
            lenisRef.current.destroy();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }

        const lenis = new Lenis({
            wrapper: lenisScrollerRef.current,
            content: lenisContentRef.current,
            lerp: settings.lenisLerp,
            wheelMultiplier: settings.lenisWheelMultiplier,
            smoothWheel: true,
            orientation: 'vertical',
        });

        lenis.on('scroll', ({ progress: p }: { progress: number }) => {
            setProgress(p);
        });

        const raf = (time: number) => {
            lenis.raf(time);
            rafRef.current = requestAnimationFrame(raf);
        };
        rafRef.current = requestAnimationFrame(raf);

        lenisRef.current = lenis;

        return () => {
            lenis.destroy();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // Re-create Lenis whenever its physics params or urls change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urls, settings.lenisLerp, settings.lenisWheelMultiplier, settings.scrollDistance]);

    // Reset progress when urls change (new ZIP loaded)
    useEffect(() => {
        setProgress(0);
    }, [urls]);

    // ── Scrubber drag helpers ─────────────────────────────────────────────────
    const getProgressFromPointer = useCallback((clientY: number): number => {
        const rail = scrubberRailRef.current;
        if (!rail) return 0;
        const rect = rail.getBoundingClientRect();
        return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    }, []);

    const seekToProgress = useCallback((p: number) => {
        const lenis = lenisRef.current;
        const content = lenisContentRef.current;
        if (!lenis || !content) {
            setProgress(p);
            return;
        }
        // Convert 0-1 to pixel scroll position
        const maxScroll = content.scrollHeight - (lenisScrollerRef.current?.clientHeight ?? 0);
        lenis.scrollTo(p * maxScroll, { immediate: true });
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        seekToProgress(getProgressFromPointer(e.clientY));
    }, [getProgressFromPointer, seekToProgress]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        seekToProgress(getProgressFromPointer(e.clientY));
    }, [getProgressFromPointer, seekToProgress]);

    const onPointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    // Virtual scroll height in px driven by scrollDistance (vh)
    const virtualScrollHeight = `${settings.scrollDistance}vh`;

    return (
        <main className="h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
            {/* Navigation Header */}
            <header className="flex-shrink-0 z-50 h-16 bg-black/50 backdrop-blur-md border-b border-[var(--border)] pr-4 pl-4 md:pl-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        onClick={() => { if (urls.length > 0) urls.forEach(URL.revokeObjectURL); }}
                        className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Converter
                    </Link>
                    <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />
                    <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 text-xs font-medium text-brand-300">
                        <Layers className="w-3.5 h-3.5" />
                        Phase 2: ScrollyTelling Sandbox
                    </div>
                </div>
                {urls.length > 0 && (
                    <button
                        onClick={handleReset}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        Reset &amp; Load New ZIP
                    </button>
                )}
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {urls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <SandboxLoader onLoad={setUrls} />
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row h-full">

                        {/* ── Left: Phone Preview with Lenis Virtual Scroller ── */}
                        <div className="relative flex-1 lg:max-w-[65%] border-r border-[var(--border)] bg-zinc-950 flex items-center justify-center overflow-hidden">

                            {/* Lenis virtual scroller (fills the preview area, hidden scrollbar) */}
                            <div
                                ref={lenisScrollerRef}
                                className="absolute inset-0 overflow-hidden"
                                style={{ overflowY: 'scroll', scrollbarWidth: 'none' }}
                            >
                                {/* Tall virtual content — creates the scroll space */}
                                <div
                                    ref={lenisContentRef}
                                    style={{ height: `calc(100% + ${virtualScrollHeight})` }}
                                    aria-hidden="true"
                                />
                            </div>

                            {/* Phone frame — sits on top, pointer-events blocked so wheel passes through */}
                            <div className="relative z-10 flex items-center justify-center w-full h-full pointer-events-none">
                                <CanvasSequence
                                    urls={urls}
                                    scrubSmoothness={settings.scrubSmoothness}
                                    isMobilePreview={settings.isMobilePreview}
                                    progress={progress}
                                />
                            </div>

                            {/* ── Vertical Scrubber Rail ── */}
                            <div className="absolute right-5 top-8 bottom-8 w-10 flex flex-col items-center select-none z-30 pointer-events-auto">

                                {/* Label: top */}
                                <div className="flex flex-col items-center gap-1 mb-3">
                                    <span className="text-[9px] font-mono text-emerald-400/90 uppercase tracking-widest font-bold leading-tight text-center">
                                        Start
                                    </span>
                                    <div className="w-4 h-px bg-emerald-400/50" />
                                </div>

                                {/* Rail track — draggable */}
                                <div
                                    ref={scrubberRailRef}
                                    className="relative flex-1 w-3 rounded-full bg-white/10 cursor-ns-resize touch-none"
                                    onPointerDown={onPointerDown}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={onPointerUp}
                                    onPointerCancel={onPointerUp}
                                >
                                    {/* Filled track */}
                                    <div
                                        className="absolute top-0 left-0 w-full rounded-full bg-brand-500 shadow-[0_0_10px_2px_rgba(91,108,248,0.7)] transition-none"
                                        style={{ height: `${progress * 100}%` }}
                                    />

                                    {/* Drag handle (thumb) */}
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-brand-500 shadow-lg shadow-brand-500/50 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                                        style={{ top: `${progress * 100}%` }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                    </div>

                                    {/* Floating % badge */}
                                    <div
                                        className="absolute right-5 -translate-y-1/2 pointer-events-none flex items-center justify-center min-w-[38px] h-6 bg-black/80 backdrop-blur-md px-1.5 rounded-md text-[10px] font-mono font-bold text-white border border-white/10 shadow-lg"
                                        style={{ top: `${progress * 100}%` }}
                                    >
                                        {Math.round(progress * 100)}%
                                    </div>
                                </div>

                                {/* Label: bottom */}
                                <div className="flex flex-col items-center gap-1 mt-3">
                                    <div className="w-4 h-px bg-red-400/50" />
                                    <span className="text-[9px] font-mono text-red-400/90 uppercase tracking-widest font-bold leading-tight text-center">
                                        End
                                    </span>
                                </div>
                            </div>

                            {/* Lenis params indicator */}
                            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-3 pointer-events-none">
                                <span className="text-[10px] font-mono text-white/30 bg-black/40 px-2 py-1 rounded-md">
                                    lerp {settings.lenisLerp.toFixed(2)} · ×{settings.lenisWheelMultiplier.toFixed(1)} wheel
                                </span>
                            </div>
                        </div>

                        {/* ── Right: Tuning Panel & Export ── */}
                        <div className="w-full lg:w-[35%] min-w-[320px] max-w-lg p-6 space-y-6 h-full overflow-y-auto custom-scrollbar bg-[var(--background)] z-20">
                            <TuningPanel settings={settings} onChange={setSettings} />
                            <CodeExport settings={settings} frameCount={urls.length} />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
