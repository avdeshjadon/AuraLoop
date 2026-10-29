import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import createOrderHandler from './api/cashfree/create-order.js';
import verifyOrderHandler from './api/cashfree/verify-order.js';
import entitlementsHandler from './api/admin/entitlements.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function devApiPlugin() {
  return {
    name: 'auraloop-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/cashfree/create-order')) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            req.body = body;
            await createOrderHandler(req, res);
          });
          return;
        }
        if (url.startsWith('/api/cashfree/verify-order')) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            req.body = body;
            await verifyOrderHandler(req, res);
          });
          return;
        }
        if (url.startsWith('/api/admin/entitlements')) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            req.body = body;
            await entitlementsHandler(req, res);
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for local serverless functions
  Object.assign(process.env, env);

  return {
    plugins: [react(), devApiPlugin()],
    resolve: {
      alias: {
        '../../shared': path.resolve(__dirname, './shared'),
        '../../../shared': path.resolve(__dirname, './shared'),
      },
    },
  };
});
