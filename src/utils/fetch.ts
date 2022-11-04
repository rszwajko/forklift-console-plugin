import { useMemo } from 'react';
import { ProviderResource } from 'src/internal/k8s';

import { MOCK_CLUSTER_PROVIDERS } from '@app/queries/mocks/providers.mock';
import { useK8sWatchResource, WatchK8sResult } from '@openshift-console/dynamic-plugin-sdk';

const isMock = process.env.DATA_SOURCE === 'mock';

function useMockK8sWatchResource<T>(resource, mockData: T[] = []): WatchK8sResult<T[]> {
  return [mockData, true, false];
}

function useRealK8sWatchResource<T>({ kind, namespace, name }): WatchK8sResult<T[]> {
  return useK8sWatchResource<T[]>({
    kind,
    isList: true,
    namespaced: true,
    namespace,
    name,
  });
}

export const useMockableK8sWatchResource = isMock
  ? useMockK8sWatchResource
  : useRealK8sWatchResource;

export const useProviders = ({ kind, namespace, name }) => {
  const mock: ProviderResource[] = useMemo(
    () =>
      MOCK_CLUSTER_PROVIDERS?.filter(
        (provider) => !name || provider?.metadata?.name === name,
      ) as ProviderResource[],
    [name],
  );
  return useMockableK8sWatchResource<ProviderResource>({ kind, namespace, name }, mock);
};
