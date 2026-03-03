'use client';

import { useState, useRef, useCallback } from 'react';
import { isMultiThreadSupported } from '@/lib/ffmpeg/ffmpeg-config';

export interface ConversionSettings {
    fps: number;
    width: number | null;
    quality: number; // 1–100
}

export interface UseFFmpegReturn {
    isLoading: boolean;
    isReady: boolean;
    isConverting: boolean;
    progress: number;
    frames: Blob[];
    error: string | null;
    isMultiThread: boolean;
    loadFFmpeg: () => Promise<void>;
    convertVideoToFrames: (file: File, settings: ConversionSettings) => Promise<void>;
    reset: () => void;
}

// Declare the global from the UMD script loaded in layout.tsx
declare global {
    interface Window {
        FFmpegWASM?: {
            FFmpeg: new () => {
                on: (event: string, cb: (data: { progress: number; ratio: number }) => void) => void;
                load: (config: Record<string, string>) => Promise<void>;
                writeFile: (name: string, data: Uint8Array) => Promise<void>;
                readFile: (name: string) => Promise<Uint8Array>;
                deleteFile: (name: string) => Promise<void>;
                exec: (args: string[]) => Promise<number>;
            };
        };
    }
}

export function useFFmpeg(): UseFFmpegReturn {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ffmpegRef = useRef<any>(null);
    const loadingRef = useRef(false);
    const readyRef = useRef(false);
    const progressRef = useRef(0);

    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [frames, setFrames] = useState<Blob[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isMultiThread, setIsMultiThread] = useState(false);

    const loadFFmpeg = useCallback(async () => {
        if (readyRef.current || loadingRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            // Wait for UMD script to expose window.FFmpegWASM
            const FFmpegWASM = await waitForFFmpegWASM();
            const { FFmpeg: FFmpegClass } = FFmpegWASM;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ffmpeg = new (FFmpegClass as any)();
            const mtSupported = isMultiThreadSupported();
            setIsMultiThread(mtSupported);

            ffmpeg.on('progress', ({ progress: p }: { progress: number }) => {
                const pct = Math.round(Math.min(p, 1) * 100);
                if (pct !== progressRef.current) {
                    progressRef.current = pct;
                    requestAnimationFrame(() => setProgress(pct));
                }
            });

            // Listen to internal FFmpeg logs for debugging
            ffmpeg.on('log', ({ message }: { message: string }) => {
                console.log('[FFmpeg Log]', message);
            });

            // Load core files from local /public/ffmpeg/ paths
            // Use absolute URLs so the Web Worker spawned by FFmpeg can resolve them correctly
            const baseURL = window.location.origin;

            if (mtSupported) {
                await ffmpeg.load({
                    coreURL: `${baseURL}/ffmpeg/ffmpeg-core-mt.js`,
                    wasmURL: `${baseURL}/ffmpeg/ffmpeg-core-mt.wasm`,
                    workerURL: `${baseURL}/ffmpeg/ffmpeg-core-mt.worker.js`,
                });
            } else {
                await ffmpeg.load({
                    coreURL: `${baseURL}/ffmpeg/ffmpeg-core.js`,
                    wasmURL: `${baseURL}/ffmpeg/ffmpeg-core.wasm`,
                });
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ffmpegRef.current = ffmpeg as any;
            readyRef.current = true;
            setIsReady(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load FFmpeg WASM.';
            setError(message);
            console.error('[FFmpeg] Load error:', err);
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const convertVideoToFrames = useCallback(
        async (file: File, settings: ConversionSettings) => {
            if (!ffmpegRef.current || !readyRef.current) {
                setError('FFmpeg is not loaded. Please wait and try again.');
                return;
            }

            setIsConverting(true);
            progressRef.current = 0;
            setProgress(0);
            setFrames([]);
            setError(null);

            const ffmpeg = ffmpegRef.current;
            const inputName = 'input_video';

            try {
                const fileData = await fetchFile(file);
                await ffmpeg.writeFile(inputName, fileData);

                const vfFilters: string[] = [];
                if (settings.fps) vfFilters.push(`fps=${settings.fps}`);
                if (settings.width) vfFilters.push(`scale=${settings.width}:-2`);

                const args: string[] = ['-i', inputName];
                if (vfFilters.length > 0) args.push('-vf', vfFilters.join(','));
                const q = Math.round(100 - settings.quality);
                // Force libwebp encoder and image2 muxer to ensure individual frames are output instead of an animated WebP
                args.push('-c:v', 'libwebp', '-f', 'image2', '-qscale:v', String(q), 'frame_%03d.webp');

                await ffmpeg.exec(args);

                const outputBlobs: Blob[] = [];
                for (let i = 1; ; i++) {
                    const fname = `frame_${String(i).padStart(3, '0')}.webp`;
                    try {
                        const data = await ffmpeg.readFile(fname);
                        outputBlobs.push(new Blob([new Uint8Array(data)], { type: 'image/webp' }));
                        await ffmpeg.deleteFile(fname);
                    } catch { break; }
                }

                await ffmpeg.deleteFile(inputName);

                if (outputBlobs.length === 0) {
                    throw new Error('No frames extracted — check your video file.');
                }

                setFrames(outputBlobs);
                setProgress(100);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Conversion failed.';
                setError(message);
            } finally {
                setIsConverting(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        progressRef.current = 0;
        setFrames([]);
        setProgress(0);
        setError(null);
        setIsConverting(false);
    }, []);

    return { isLoading, isReady, isConverting, progress, frames, error, isMultiThread, loadFFmpeg, convertVideoToFrames, reset };
}

/** Poll for window.FFmpegWASM to be available (loaded by Script tag) */
async function waitForFFmpegWASM(maxWaitMs = 10000): Promise<NonNullable<Window['FFmpegWASM']>> {
    const start = Date.now();
    while (!window.FFmpegWASM) {
        if (Date.now() - start > maxWaitMs) {
            throw new Error('FFmpeg script timed out. Check your network connection.');
        }
        await new Promise((r) => setTimeout(r, 100));
    }
    return window.FFmpegWASM;
}

/** Helper to convert File/Blob/URL directly into Uint8Array for FFmpeg */
async function fetchFile(file: File | Blob | string): Promise<Uint8Array> {
    if (typeof file === 'string') {
        const response = await fetch(file);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
}
