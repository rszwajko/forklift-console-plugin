import { ProviderResource } from 'src/internal/k8s';

import { MOCK_CLUSTER_PROVIDERS } from '@app/queries/mocks/providers.mock';
import {
  useK8sWatchResource,
  WatchK8sResult,
} from '@openshift-console/dynamic-plugin-sdk';

const isMock = process.env.DATA_SOURCE === 'mock';

export function useMockableK8sWatchResource<T>(
  { kind, namespace },
  mockData: T[] = [],
): WatchK8sResult<T[]> {
  return isMock
    ? [mockData, true, false]
    : useK8sWatchResource<T[]>({
        kind,
        isList: true,
        namespaced: true,
        namespace,
      });
}

export const useProviders = ({ kind, namespace }) =>
  useMockableK8sWatchResource<ProviderResource>(
    { kind, namespace },
    MOCK_CLUSTER_PROVIDERS as ProviderResource[],
  );
