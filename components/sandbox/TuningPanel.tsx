'use client';

import { Settings2, Maximize, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';

export interface SandboxSettings {
    scrollDistance: number;
    scrubSmoothness: number;
    isPinning: boolean;
    isMobilePreview: boolean;
}

interface TuningPanelProps {
    settings: SandboxSettings;
    onChange: (settings: SandboxSettings) => void;
}

function SliderInput({
    min,
    max,
    step = 1,
    value,
    onChange,
}: {
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (v: number) => void;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
                background: `linear-gradient(to right, #5b6cf8 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(91,108,248,0.8)]"
        />
    );
}

export function TuningPanel({ settings, onChange }: TuningPanelProps) {
    return (
        <div className="glass rounded-2xl p-6 space-y-8 animate-slide-up">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">GSAP Parameters</h3>
                    <p className="text-xs text-[var(--text-muted)]">Live scroll animation tuning</p>
                </div>
            </div>

            {/* Scroll Distance */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <Maximize className="w-4 h-4 text-brand-400" />
                        Scroll Distance
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {settings.scrollDistance}vh
                    </span>
                </div>
                <SliderInput
                    min={100}
                    max={1000}
                    step={100}
                    value={settings.scrollDistance}
                    onChange={(v) => onChange({ ...settings, scrollDistance: v })}
                />
                <p className="text-xs text-[var(--text-muted)]">
                    How tall the scrollable area should be. Higher = slower playback.
                </p>
            </div>

            {/* Scrub Smoothness */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <MousePointer2 className="w-4 h-4 text-brand-400" />
                        Scrub Smoothness
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {settings.scrubSmoothness === 0 ? 'Instant' : `${settings.scrubSmoothness}s`}
                    </span>
                </div>
                <SliderInput
                    min={0}
                    max={2}
                    step={0.1}
                    value={settings.scrubSmoothness}
                    onChange={(v) => onChange({ ...settings, scrubSmoothness: v })}
                />
                <p className="text-xs text-[var(--text-muted)]">
                    0 = direct lock to scrollbar (harsh). &gt;0 = smooth interpolation (heavy feel).
                </p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                    type="button"
                    onClick={() => onChange({ ...settings, isPinning: !settings.isPinning })}
                    className={clsx(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors",
                        settings.isPinning
                            ? "bg-brand-500/10 border-brand-500 text-brand-400"
                            : "bg-white/5 border-[var(--border)] text-[var(--text-muted)] hover:bg-white/10"
                    )}
                >
                    <span className="text-xs font-semibold">Pinned Canvas</span>
                    <span className="text-[10px] uppercase opacity-70">
                        {settings.isPinning ? 'Active' : 'Disabled'}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => onChange({ ...settings, isMobilePreview: !settings.isMobilePreview })}
                    className={clsx(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors",
                        settings.isMobilePreview
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-white/5 border-[var(--border)] text-[var(--text-muted)] hover:bg-white/10"
                    )}
                >
                    <span className="text-xs font-semibold">Simulated Size</span>
                    <span className="text-[10px] uppercase opacity-70">
                        {settings.isMobilePreview ? 'Mobile (375px)' : 'Desktop (Full)'}
                    </span>
                </button>
            </div>
        </div>
    );
}
