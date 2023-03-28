import withQueryClient from '@kubev2v/common/components/QueryClientHoc';
import { withModalProvider } from '@kubev2v/common/polyfills/sdk-shim';
import { worker } from '@kubev2v/mocks/src/browser';

import ProvidersPage from './ProvidersPage';

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

const ProvidersWrapper = withQueryClient(withModalProvider(ProvidersPage));
ProvidersWrapper.displayName = 'ProvidersWrapper';

export default ProvidersWrapper;
