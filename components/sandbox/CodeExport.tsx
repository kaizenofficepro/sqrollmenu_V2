'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code2, Copy, CheckCircle2 } from 'lucide-react';
import { SandboxSettings } from './TuningPanel';

interface CodeExportProps {
    settings: SandboxSettings;
    frameCount: number;
}

export function CodeExport({ settings, frameCount }: CodeExportProps) {
    const [copied, setCopied] = useState(false);

    const generatedCode = `
import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────
// Tuned Parameters (from ScrollyTelling Sandbox)
// ─────────────────────────────────────────────────
const CONFIG = {
    frameCount: ${frameCount},
    scrubInertia: ${settings.scrubSmoothness},     // GSAP scrub delay in seconds
    scrollDistance: '${settings.scrollDistance}vh', // scrollable pin height
    pin: ${settings.isPinning},
    lenisLerp: ${settings.lenisLerp},              // Lenis smoothing (0.01–1)
    lenisWheelMultiplier: ${settings.lenisWheelMultiplier}, // wheel sensitivity
};

// 1. Array of your generated WEBP frame URLs
const FRAME_URLS = Array.from(
    { length: CONFIG.frameCount },
    (_, i) => \`/frames/frame_\${String(i + 1).padStart(3, '0')}.webp\`
);

// 2. Init Lenis (smooth scroll engine) once at app level
const lenis = new Lenis({
    lerp: CONFIG.lenisLerp,
    wheelMultiplier: CONFIG.lenisWheelMultiplier,
    smoothWheel: true,
});

// Connect Lenis RAF loop to GSAP ScrollTrigger
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

export function MyScrollAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);

    useEffect(() => {
        // Preload all ${frameCount} images to memory to prevent flickering
        const imgArray: HTMLImageElement[] = [];
        let loadedCount = 0;

        FRAME_URLS.forEach((url, i) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                imgArray[i] = img;
                loadedCount++;
                if (loadedCount === FRAME_URLS.length) {
                    setImages(imgArray);
                    const ctx = canvasRef.current?.getContext('2d');
                    if (ctx && imgArray[0]) {
                        canvasRef.current!.width = imgArray[0].width;
                        canvasRef.current!.height = imgArray[0].height;
                        ctx.drawImage(imgArray[0], 0, 0);
                    }
                }
            };
        });

        return () => { lenis.destroy(); };
    }, []);

    useGSAP(() => {
        if (images.length === 0) return;

        const sequence = { frame: 0 };
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        const trigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: \`+=\${CONFIG.scrollDistance}\`,
            pin: CONFIG.pin,
            scrub: CONFIG.scrubInertia,
            animation: gsap.to(sequence, {
                frame: ${frameCount - 1},
                snap: 'frame',
                ease: 'none',
                onUpdate: () => {
                    const img = images[Math.round(sequence.frame)];
                    if (img && ctx && canvas) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                }
            })
        });

        return () => trigger.kill();
    }, { dependencies: [images], scope: containerRef });

    return (
        <div ref={containerRef} style={{ height: '${settings.isPinning ? '100vh' : `${settings.scrollDistance}vh`}' }} className="relative w-full overflow-hidden bg-black">
            <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                <canvas ref={canvasRef} className="max-h-full object-cover w-full ${settings.isMobilePreview ? 'max-w-[375px]' : ''}" />
            </div>
        </div>
    );
}
`.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass rounded-2xl overflow-hidden animate-slide-up bg-black/40">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Generated React Component</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    {copied ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                    ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy Code</>
                    )}
                </button>
            </div>

            <div className="max-h-[400px] overflow-auto text-[11px] leading-relaxed custom-scrollbar">
                <SyntaxHighlighter
                    language="typescript"
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                    }}
                >
                    {generatedCode}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
