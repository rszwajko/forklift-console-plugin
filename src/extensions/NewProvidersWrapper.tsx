import * as React from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import ProvidersPage from 'src/Providers/ProvidersPage';

const queryCache = new QueryCache();
const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FunctionComponent = ({
  namespace,
  kind,
}: {
  namespace: string;
  kind: string;
}) => (
  <QueryClientProvider client={queryClient}>
    <ProvidersPage namespace={namespace} kind={kind} />
    {process.env.NODE_ENV !== 'test' ? <ReactQueryDevtools /> : null}
  </QueryClientProvider>
);

export default App;
