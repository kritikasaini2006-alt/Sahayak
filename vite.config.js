import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load server-side environment variables from .env and .env.local without VITE_ prefix restriction
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  }

  return {
    plugins: [
      react(),
      {
        name: 'sahayak-local-chat-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/chat' && req.method === 'POST') {
              let bodyStr = '';
              let tooLarge = false;
              req.on('data', (chunk) => {
                bodyStr += chunk;
                if (bodyStr.length > 32768) {
                  tooLarge = true;
                  res.statusCode = 413;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Payload Too Large: Maximum request body size is 32 KB.' }));
                  req.destroy();
                }
              });
              req.on('end', async () => {
                if (tooLarge) return;
                try {
                  const { processChatRequest } = await import('./api/chat.js');
                  const payload = bodyStr ? JSON.parse(bodyStr) : {};
                  const result = await processChatRequest(payload);
                  res.statusCode = result.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result.body));
                } catch (err) {
                  console.error('Error handling /api/chat in Vite dev middleware:', err?.name || 'InternalError');
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
                }
              });
              return;
            }

            if (req.url === '/api/transcribe' && req.method === 'POST') {
              let bodyStr = '';
              let tooLarge = false;
              req.on('data', (chunk) => {
                bodyStr += chunk;
                if (bodyStr.length > 5 * 1024 * 1024) {
                  tooLarge = true;
                  res.statusCode = 413;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Payload Too Large: Maximum audio request size is 5 MB.' }));
                  req.destroy();
                }
              });
              req.on('end', async () => {
                if (tooLarge) return;
                try {
                  const { processTranscribeRequest } = await import('./api/transcribe.js');
                  const payload = bodyStr ? JSON.parse(bodyStr) : {};
                  const result = await processTranscribeRequest(payload);
                  res.statusCode = result.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result.body));
                } catch (err) {
                  console.error('Error handling /api/transcribe in Vite dev middleware:', err?.name || 'InternalError');
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/react-router/') ||
                id.includes('/react-router-dom/')
              ) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
