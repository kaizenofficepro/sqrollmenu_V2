/**
 * FFmpeg WASM configuration.
 * Core files are served locally from /public/ffmpeg/ to avoid Next.js/webpack
 * intercepting dynamic import() calls that point to external URLs.
 */

/** Local static paths for FFmpeg single-threaded core (served from public/) */
export const FFMPEG_CORE_URL = '/ffmpeg/ffmpeg-core.js';
export const FFMPEG_CORE_WASM_URL = '/ffmpeg/ffmpeg-core.wasm';

/** Max upload size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Check if SharedArrayBuffer is available (browser-only) */
export function isMultiThreadSupported(): boolean {
    // Forcing single-thread mode: WASM multi-threading often deadlocks during
    // libwebp image sequence encoding in Chrome depending on the exact build.
    return false;
}
