'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Film } from 'lucide-react';

interface FilmstripProps {
    frames: Blob[];
    fps: number;
}

export function Filmstrip({ frames, fps }: FilmstripProps) {
    const [urls, setUrls] = useState<string[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Create object URLs for all blobs
    useEffect(() => {
        const created = frames.map((blob) => URL.createObjectURL(blob));
        setUrls(created);
        setCurrentFrame(0);
        setIsPlaying(false);
        return () => created.forEach((u) => URL.revokeObjectURL(u));
    }, [frames]);

    const stopPlayback = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const startPlayback = useCallback(() => {
        if (urls.length === 0) return;
        stopPlayback();
        const delay = Math.round(1000 / fps);
        intervalRef.current = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % urls.length);
        }, delay);
        setIsPlaying(true);
    }, [urls, fps, stopPlayback]);

    const togglePlayback = () => {
        isPlaying ? stopPlayback() : startPlayback();
    };

    // Cleanup on unmount
    useEffect(() => () => stopPlayback(), [stopPlayback]);

    if (urls.length === 0) return null;

    return (
        <div className="glass rounded-2xl p-5 space-y-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                        <Film className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Frame Preview</h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {urls.length} frames extracted · {fps} fps
                        </p>
                    </div>
                </div>
                <button
                    onClick={togglePlayback}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-[var(--text-primary)]"
                >
                    {isPlaying ? (
                        <>
                            <Pause className="w-4 h-4 text-brand-400" /> Pause
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 text-brand-400" /> Play
                        </>
                    )}
                </button>
            </div>

            {/* Live preview canvas */}
            <div className="relative rounded-xl overflow-hidden bg-black/40 flex items-center justify-center" style={{ height: 220 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={urls[currentFrame]}
                    alt={`Frame ${currentFrame + 1}`}
                    className="max-h-full max-w-full object-contain"
                />
                <span className="absolute bottom-2 right-3 text-xs font-mono text-white/50 bg-black/60 px-2 py-0.5 rounded-md">
                    {currentFrame + 1} / {urls.length}
                </span>
            </div>

            {/* Filmstrip scrollable */}
            <div className="overflow-x-auto pb-1">
                <div className="flex gap-2" style={{ width: 'max-content' }}>
                    {urls.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => { stopPlayback(); setCurrentFrame(i); }}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === currentFrame
                                    ? 'border-brand-500 scale-105 shadow-[0_0_8px_rgba(91,108,248,0.6)]'
                                    : 'border-transparent hover:border-white/20'
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`f${i}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
