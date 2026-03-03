'use client';

import { useState } from 'react';
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
    scrubSmoothness: 0.5,
    isPinning: true,
    isMobilePreview: true,
};

export default function SandboxPage() {
    const [urls, setUrls] = useState<string[]>([]);
    const [settings, setSettings] = useState<SandboxSettings>(DEFAULT_SETTINGS);

    const handleReset = () => {
        // Revoke all Blob URLs to prevent memory leaks
        urls.forEach(URL.revokeObjectURL);
        setUrls([]);
    };

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
                        Reset & Load New ZIP
                    </button>
                )}
            </header>

            {/* Main Content Area (Fixed Height, Flex) */}
            <div className="flex-1 overflow-hidden relative">
                {urls.length === 0 ? (
                    // Loader State
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <SandboxLoader onLoad={setUrls} />
                    </div>
                ) : (
                    // Simulator State (Split Screen)
                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Left Side: Preview Canvas (Scrollable Viewport) */}
                        {/* Hidden scrollbar to create a "locked" Photoshop-like UX, while still allowing GSAP to track wheel events */}
                        <div
                            className="relative flex-1 lg:max-w-[65%] border-r border-[var(--border)] bg-zinc-950 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            id="sandbox-scroller"
                        >

                            {/* The scrollable height container */}
                            <div style={{ height: settings.isPinning ? '100%' : `${settings.scrollDistance}vh` }}>
                                <CanvasSequence
                                    urls={urls}
                                    scrollDistance={settings.scrollDistance}
                                    scrubSmoothness={settings.scrubSmoothness}
                                    isPinning={settings.isPinning}
                                    isMobilePreview={settings.isMobilePreview}
                                    scrollerId="#sandbox-scroller"
                                />
                            </div>

                        </div>

                        {/* Right Side: Tuning Panel & Export (Locked) */}
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
