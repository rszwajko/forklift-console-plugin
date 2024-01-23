import { useMemo } from 'react';

import {
  OpenshiftResource,
  OpenstackResource,
  OvaResource,
  OVirtResource,
  V1beta1Provider,
  VSphereResource,
} from '@kubev2v/types';
import { V1beta1NetworkMapSpecMapSource } from '@kubev2v/types/dist/models/V1beta1NetworkMapSpecMapSource';

import useProviderInventory from './useProviderInventory';

type InventoryNetwork = OpenshiftResource &
  OpenstackResource &
  OvaResource &
  OVirtResource &
  VSphereResource;

export const useNetworks = (
  provider: V1beta1Provider,
): [V1beta1NetworkMapSpecMapSource[], boolean, Error] => {
  const {
    inventory: networks,
    loading,
    error,
  } = useProviderInventory<InventoryNetwork[]>({
    provider,
    subPath: provider?.spec?.type === 'openshift' ? '/networkattachmentdefinitions' : '/networks',
  });

  const unifiedNetworks: V1beta1NetworkMapSpecMapSource[] = useMemo(
    () =>
      networks?.map(({ id, uid, name, namespace }) => ({ id: id ?? uid, name, namespace })) ?? [],
    [networks],
  );

  return [!loading && !error ? unifiedNetworks : [], loading, error];
};
