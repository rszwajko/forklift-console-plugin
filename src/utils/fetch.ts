import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

const isMock = process.env.DATA_SOURCE === 'mock';

export function useMockableK8sWatchResource<T>(
  { kind, namespace },
  mockData: T[] = [],
) {
  return isMock
    ? [mockData, true, false]
    : useK8sWatchResource<T[]>({
        kind,
        isList: true,
        namespaced: true,
        namespace,
      });
}
