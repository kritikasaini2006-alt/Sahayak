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
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const { processChatRequest } = await import('./api/chat.js');
                  const payload = bodyStr ? JSON.parse(bodyStr) : {};
                  const result = await processChatRequest(payload);
                  res.statusCode = result.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result.body));
                } catch (err) {
                  console.error('Error handling /api/chat in Vite dev middleware:', err);
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
    server: {
      port: 3000,
      open: false,
    },
  };
});
