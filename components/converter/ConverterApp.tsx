'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Zap, Layers, AlertTriangle, CheckCircle2, Loader2, Cpu } from 'lucide-react';
import {
    DropZone,
    SettingsPanel,
    ProgressBar,
    Filmstrip,
    ExportButton,
    TargetSelector,
    TargetDevice,
} from '@/components/converter';
import { useFFmpeg, ConversionSettings } from '@/hooks/use-ffmpeg';
import Link from 'next/link';

const DEFAULT_SETTINGS_MOBILE: ConversionSettings = {
    fps: 20,
    width: 720,
    quality: 65,
};

const DEFAULT_SETTINGS_DESKTOP: ConversionSettings = {
    fps: 24,
    width: 1280,
    quality: 80,
};

function SectionLabel({ number, label }: { number: number; label: string }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600/20 border border-brand-500/30 text-xs font-bold text-brand-300">
                {number}
            </span>
            <span className="text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                {label}
            </span>
        </div>
    );
}

export function ConverterApp() {
    const {
        isLoading,
        isReady,
        isConverting,
        progress,
        frames,
        error,
        isMultiThread,
        loadFFmpeg,
        convertVideoToFrames,
        reset,
    } = useFFmpeg();

    const [targetDevice, setTargetDevice] = useState<TargetDevice | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS_MOBILE);

    // Apply dynamic defaults when target device changes
    useEffect(() => {
        if (targetDevice === 'mobile') {
            setSettings(DEFAULT_SETTINGS_MOBILE);
        } else if (targetDevice === 'desktop') {
            setSettings(DEFAULT_SETTINGS_DESKTOP);
        }
    }, [targetDevice]);

    // Load FFmpeg once on mount (loadFFmpeg is stable – deps: [])
    useEffect(() => {
        loadFFmpeg();
    }, [loadFFmpeg]);

    // Surface errors as toasts
    useEffect(() => {
        if (error) toast.error(error, { duration: 6000 });
    }, [error]);

    const handleFile = (file: File) => { setVideoFile(file); reset(); };
    const handleClear = () => { setVideoFile(null); reset(); };
    const handleBackToDevice = () => { setVideoFile(null); setTargetDevice(null); reset(); };

    const handleConvert = async () => {
        if (!videoFile || !isReady) return;
        await convertVideoToFrames(videoFile, settings);
        if (frames.length > 0) toast.success('Frames extracted successfully!');
    };

    const isBusy = isLoading || isConverting;

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 text-xs font-medium text-brand-300">
                        <Layers className="w-3.5 h-3.5" />
                        Phase 1: Asset Optimizer
                    </div>
                    <Link href="/sandbox" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors">
                        Launch Sandbox
                        <span className="text-[10px] ml-1 opacity-60">→</span>
                    </Link>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text leading-tight">
                    Asset Optimizer
                </h1>
                <p className="text-lg text-[var(--text-secondary)] max-w-lg mx-auto">
                    Convert product videos into optimized WebP frame sequences for scroll-linked animations.
                </p>

                {/* FFmpeg status */}
                <div className="flex items-center justify-center gap-2 text-xs">
                    {isLoading && (
                        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                            Loading FFmpeg WASM…
                        </span>
                    )}
                    {isReady && (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            FFmpeg ready
                            {isMultiThread && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-600/15 border border-emerald-500/20 font-mono">
                                    multi-thread
                                </span>
                            )}
                        </span>
                    )}
                    {!isLoading && !isReady && error && (
                        <span className="flex items-center gap-1.5 text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            FFmpeg failed to load
                        </span>
                    )}
                </div>
            </header>

            {/* Step 1: Target Selection */}
            {!targetDevice && (
                <section className="space-y-4 animate-slide-up">
                    <SectionLabel number={1} label="Choose Target Format" />
                    <TargetSelector value={targetDevice} onChange={setTargetDevice} disabled={isBusy} />
                </section>
            )}

            {/* Step 2: Upload */}
            {targetDevice && !videoFile && (
                <section className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between mb-3">
                        <SectionLabel number={2} label="Upload Video" />
                        <button
                            onClick={handleBackToDevice}
                            disabled={isBusy}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            ← Back to format selection
                        </button>
                    </div>
                    <DropZone file={videoFile} onFile={handleFile} onClear={handleClear} disabled={isBusy} />
                </section>
            )}

            {/* Step 3: Settings */}
            {targetDevice && videoFile && (
                <section className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between mb-3">
                        <SectionLabel number={3} label="Configure Extraction" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBackToDevice}
                                disabled={isBusy}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                ← Change format
                            </button>
                            <span className="text-xs font-mono px-2 py-1 rounded bg-brand-600/10 text-brand-400 border border-brand-500/20">
                                Target: {targetDevice?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Compact DropZone view when video is already selected */}
                    <DropZone file={videoFile} onFile={handleFile} onClear={handleClear} disabled={isBusy} />

                    <div className="pt-2">
                        <SettingsPanel settings={settings} onChange={setSettings} disabled={isBusy} />
                    </div>
                </section>
            )}

            {/* Step 4: Extract Action */}
            {videoFile && (
                <section className="space-y-4 animate-slide-up">
                    <SectionLabel number={4} label="Extract Frames" />
                    <ProgressBar progress={progress} isVisible={isConverting} />

                    {!isConverting && frames.length === 0 && (
                        <button
                            onClick={handleConvert}
                            disabled={!isReady || isBusy}
                            className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-semibold text-base"
                        >
                            {!isReady ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Waiting for FFmpeg…</>
                            ) : (
                                <><Zap className="w-5 h-5" /> Extract Frames</>
                            )}
                        </button>
                    )}
                    {isConverting && (
                        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] py-2">
                            <Cpu className="w-4 h-4 animate-pulse text-brand-400" />
                            Processing in your browser…
                        </div>
                    )}
                </section>
            )}

            {/* Step 5: Export */}
            {frames.length > 0 && (
                <section className="space-y-4 animate-slide-up">
                    <SectionLabel number={4} label="Preview & Export" />
                    <Filmstrip frames={frames} fps={settings.fps} />
                    <ExportButton frames={frames} />
                </section>
            )}

            {/* Footer */}
            <footer className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
                ScrollMotion · Phase 1 of 3 · All processing runs 100% client-side
            </footer>
        </div>
    );
}
