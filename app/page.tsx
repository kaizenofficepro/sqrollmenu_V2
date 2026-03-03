import dynamic from 'next/dynamic';

/**
 * Dynamically import the converter with ssr: false.
 * This prevents FFmpeg WASM / SharedArrayBuffer code from running server-side,
 * which would cause React hydration mismatches (the "Should have a queue" error).
 */
const ConverterApp = dynamic(
    () => import('@/components/converter/ConverterApp').then((m) => m.ConverterApp),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin mx-auto" />
                    <p className="text-sm text-[var(--text-secondary)]">Initializing…</p>
                </div>
            </div>
        ),
    }
);

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[var(--bg-base)]">
            {/* Ambient background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/5 blur-[120px]" />
                <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-700/5 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
                <ConverterApp />
            </div>
        </main>
    );
}
