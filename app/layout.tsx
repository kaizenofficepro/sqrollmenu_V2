import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'ScrollMotion – Asset Optimizer',
    description:
        'Convert product videos into optimized WebP frame sequences for smooth scrollytelling animations.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                {/* Load @ffmpeg/ffmpeg UMD build via script tag to bypass Next.js webpack bundling.
                    This exposes window.FFmpegWASM which the hook uses at runtime. */}
                <Script
                    src="/ffmpeg/ffmpeg.js"
                    strategy="beforeInteractive"
                />
                {children}
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#18181f',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#f1f1f5',
                        },
                    }}
                />
            </body>
        </html>
    );
}
