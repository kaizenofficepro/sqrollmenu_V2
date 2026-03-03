import { Smartphone, Monitor } from 'lucide-react';
import clsx from 'clsx';

export type TargetDevice = 'mobile' | 'desktop';

interface TargetSelectorProps {
    value: TargetDevice | null;
    onChange: (device: TargetDevice) => void;
    disabled?: boolean;
}

export function TargetSelector({ value, onChange, disabled }: TargetSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => onChange('mobile')}
                disabled={disabled}
                className={clsx(
                    'group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300',
                    'hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
                    value === 'mobile'
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-[var(--border)] bg-white/[0.02]'
                )}
            >
                <div
                    className={clsx(
                        'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                        value === 'mobile' ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(91,108,248,0.4)]' : 'bg-white/10 text-[var(--text-secondary)] group-hover:bg-white/20'
                    )}
                >
                    <Smartphone className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                    <h3 className={clsx('text-lg font-semibold mb-1', value === 'mobile' ? 'text-white' : 'text-[var(--text-primary)]')}>
                        Mobile Experience
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] max-w-[200px]">
                        Vertical layout, tailored for performance on phones (720px, 20fps).
                    </p>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onChange('desktop')}
                disabled={disabled}
                className={clsx(
                    'group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300',
                    'hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
                    value === 'desktop'
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-[var(--border)] bg-white/[0.02]'
                )}
            >
                <div
                    className={clsx(
                        'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                        value === 'desktop' ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(91,108,248,0.4)]' : 'bg-white/10 text-[var(--text-secondary)] group-hover:bg-white/20'
                    )}
                >
                    <Monitor className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                    <h3 className={clsx('text-lg font-semibold mb-1', value === 'desktop' ? 'text-white' : 'text-[var(--text-primary)]')}>
                        Desktop Experience
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] max-w-[200px]">
                        Crisp visuals, optimized for large horizontal screens (1280px, 24fps).
                    </p>
                </div>
            </button>
        </div>
    );
}
