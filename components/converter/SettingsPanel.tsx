'use client';

import { ConversionSettings } from '@/hooks/use-ffmpeg';
import { Cpu, Gauge, Maximize2, Zap } from 'lucide-react';

interface SettingsPanelProps {
    settings: ConversionSettings;
    onChange: (s: ConversionSettings) => void;
    disabled?: boolean;
}

function Label({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="text-brand-400">{icon}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
            {hint && <span className="text-xs text-[var(--text-muted)] ml-auto">{hint}</span>}
        </div>
    );
}

function SliderInput({
    min,
    max,
    value,
    onChange,
    disabled,
    step = 1,
}: {
    min: number;
    max: number;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
    step?: number;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="space-y-1">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    background: `linear-gradient(to right, #5b6cf8 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-500 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(91,108,248,0.8)] [&::-webkit-slider-thumb]:cursor-pointer"
            />
        </div>
    );
}

export function SettingsPanel({ settings, onChange, disabled }: SettingsPanelProps) {
    return (
        <div className="glass rounded-2xl p-6 space-y-6 animate-slide-up">
            <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
                <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Extraction Settings</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Configure output before converting</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FPS */}
                <div>
                    <Label icon={<Zap className="w-4 h-4" />} label="Frame Rate (FPS)" hint={`${settings.fps} fps`} />
                    <SliderInput
                        min={1}
                        max={60}
                        value={settings.fps}
                        disabled={disabled}
                        onChange={(v) => onChange({ ...settings, fps: v })}
                    />
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                        <span>1</span>
                        <span className="text-brand-400/70">24 = default</span>
                        <span>60</span>
                    </div>
                </div>

                {/* Quality */}
                <div>
                    <Label icon={<Gauge className="w-4 h-4" />} label="WebP Quality" hint={`${settings.quality}%`} />
                    <SliderInput
                        min={1}
                        max={100}
                        value={settings.quality}
                        disabled={disabled}
                        onChange={(v) => onChange({ ...settings, quality: v })}
                    />
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                        <span>Smallest</span>
                        <span>Largest</span>
                    </div>
                </div>

                {/* Width */}
                <div className="md:col-span-2">
                    <Label
                        icon={<Maximize2 className="w-4 h-4" />}
                        label="Output Width (px)"
                        hint="Leave empty to keep original"
                    />
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min={64}
                            max={7680}
                            disabled={disabled}
                            placeholder="Original"
                            value={settings.width ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    width: e.target.value ? Number(e.target.value) : null,
                                })
                            }
                            className="w-40 bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 transition-colors"
                        />
                        <div className="flex gap-2">
                            {[360, 720, 1080].map((w) => (
                                <button
                                    key={w}
                                    disabled={disabled}
                                    onClick={() => onChange({ ...settings, width: w })}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${settings.width === w
                                            ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]'
                                        } disabled:opacity-50`}
                                >
                                    {w}px
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Format badge */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-600/15 border border-emerald-500/25 text-emerald-400">
                        OUTPUT: WebP
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                        — best size/quality for web animations
                    </span>
                </div>
            </div>
        </div>
    );
}
