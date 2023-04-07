import { worker } from './browser';

const result = worker.start({
  serviceWorker: {
    url: '/mockServiceWorker.js',
  },
  findWorker: (scriptURL) => {
    return scriptURL.includes('mockServiceWorker');
  },
  onUnhandledRequest: 'bypass',
});
result
  .then((p) => console.warn('worker installed:', p))
  .catch((reason) => console.error('worker rejected:', reason));
