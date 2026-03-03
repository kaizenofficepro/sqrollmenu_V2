/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // COOP/COEP required for SharedArrayBuffer (FFmpeg WASM multi-threading)
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },

  webpack(config, { isServer, webpack }) {
    // Enable WASM loading
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    if (!isServer) {
      // Mark @ffmpeg/* as external so webpack passes through its import() calls
      // to the native browser without trying to bundle/resolve them
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }, callback) => {
          if (request && (request.startsWith('@ffmpeg/') || request.endsWith('.wasm'))) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        },
      ];

      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }

    return config;
  },
};

export default nextConfig;
