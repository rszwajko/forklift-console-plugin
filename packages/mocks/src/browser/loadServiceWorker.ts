import { worker } from './browser';

const pluginName = process.env.PLUGIN_NAME || 'forklift-console-plugin';

const result = worker.start({
  serviceWorker: {
    url: `/api/plugins/${pluginName}/mockServiceWorker.js`,
    options: {
      scope: '/',
    },
  },
  findWorker: (scriptURL) => {
    return scriptURL.includes('mockServiceWorker');
  },
  onUnhandledRequest: 'bypass',
});
result
  .then((p) => console.warn('worker installed:', p))
  .catch((reason) => console.error('worker rejected:', reason));
