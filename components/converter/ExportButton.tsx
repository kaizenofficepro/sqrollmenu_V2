'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
    frames: Blob[];
    disabled?: boolean;
}

export function ExportButton({ frames, disabled }: ExportButtonProps) {
    const [isZipping, setIsZipping] = useState(false);

    const handleDownload = async () => {
        if (frames.length === 0) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();

            // Read all Blobs as ArrayBuffers first to prevent JSZip corruption issues
            const bufferPromises = frames.map(async (blob, i) => {
                const arrayBuffer = await blob.arrayBuffer();
                const name = `frame_${String(i + 1).padStart(3, '0')}.webp`;
                zip.file(name, arrayBuffer, { binary: true });
            });

            await Promise.all(bufferPromises);

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'scrollmotion_frames.zip');
            toast.success(`Downloaded ${frames.length} frames as ZIP!`);
        } catch (err) {
            toast.error('Failed to create ZIP archive.');
            console.error(err);
        } finally {
            setIsZipping(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={disabled || isZipping || frames.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-white font-semibold text-sm"
        >
            {isZipping ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Packing ZIP…
                </>
            ) : (
                <>
                    <Download className="w-5 h-5" />
                    Download ZIP ({frames.length} frames)
                </>
            )}
        </button>
    );
}
