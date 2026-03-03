'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, FileVideo, X, AlertCircle } from 'lucide-react';
import { MAX_FILE_SIZE } from '@/lib/ffmpeg/ffmpeg-config';
import { clsx } from 'clsx';

interface DropZoneProps {
    file: File | null;
    onFile: (file: File) => void;
    onClear: () => void;
    disabled?: boolean;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZone({ file, onFile, onClear, disabled }: DropZoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[], rejections: FileRejection[]) => {
            if (acceptedFiles[0]) onFile(acceptedFiles[0]);
        },
        [onFile]
    );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: {
            'video/mp4': ['.mp4'],
            'video/quicktime': ['.mov'],
            'video/webm': ['.webm'],
        },
        maxSize: MAX_FILE_SIZE,
        maxFiles: 1,
        disabled,
    });

    const rejectionError = fileRejections[0]?.errors[0]?.message ?? null;

    if (file) {
        return (
            <div className="glass rounded-2xl p-6 flex items-center gap-4 animate-fade-in">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center">
                    <FileVideo className="w-6 h-6 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{formatBytes(file.size)}</p>
                </div>
                <button
                    onClick={onClear}
                    disabled={disabled}
                    className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors disabled:opacity-40"
                    title="Remove file"
                >
                    <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div
                {...getRootProps()}
                className={clsx(
                    'relative group glass rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200',
                    isDragActive
                        ? 'border-brand-500 bg-brand-600/10 scale-[1.01]'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-white/[0.02]',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input {...getInputProps()} />

                {/* Background glow on drag */}
                {isDragActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-radial from-brand-600/10 to-transparent pointer-events-none" />
                )}

                <div
                    className={clsx(
                        'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
                        isDragActive ? 'bg-brand-600/30 scale-110' : 'bg-white/5 group-hover:bg-white/10'
                    )}
                >
                    <UploadCloud
                        className={clsx(
                            'w-8 h-8 transition-colors duration-300',
                            isDragActive ? 'text-brand-400' : 'text-[var(--text-muted)] group-hover:text-brand-400'
                        )}
                    />
                </div>

                <div className="text-center">
                    <p className="text-[var(--text-primary)] font-medium">
                        {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        or <span className="text-brand-400 font-medium">browse files</span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-3">
                        Supports .mp4 · .mov · .webm · Max 50 MB
                    </p>
                </div>
            </div>

            {rejectionError && (
                <div className="flex items-center gap-2 text-sm text-red-400 px-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{rejectionError}</span>
                </div>
            )}
        </div>
    );
}
