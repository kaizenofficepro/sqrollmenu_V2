'use client';

interface ProgressBarProps {
    progress: number;
    isVisible: boolean;
}

export function ProgressBar({ progress, isVisible }: ProgressBarProps) {
    if (!isVisible) return null;

    return (
        <div className="glass rounded-2xl p-5 animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Animated spinner dot */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Processing frames…</span>
                </div>
                <span className="text-sm font-mono font-semibold text-brand-400">{progress}%</span>
            </div>

            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(to right, #4550e8, #5b6cf8, #a0b4ff)',
                        boxShadow: progress > 0 ? '0 0 12px rgba(91, 108, 248, 0.6)' : 'none',
                    }}
                />
            </div>

            <p className="text-xs text-[var(--text-muted)]">
                Running in-browser via FFmpeg WASM — page may be unresponsive during heavy conversion
            </p>
        </div>
    );
}
