import {
  OpenShiftNetworkAttachmentDefinition,
  OpenstackNetwork,
  OVirtNetwork,
  V1beta1Provider,
  VSphereNetwork,
} from '@kubev2v/types';

import useProviderInventory from './useProviderInventory';

export type InventoryNetwork =
  | OpenShiftNetworkAttachmentDefinition
  | OpenstackNetwork
  | OVirtNetwork
  | VSphereNetwork;

export const useSourceNetworks = (
  provider: V1beta1Provider,
): [InventoryNetwork[], boolean, Error] => {
  const {
    inventory: networks,
    loading,
    error,
  } = useProviderInventory<InventoryNetwork[]>({
    provider,
    subPath: provider?.spec?.type === 'openshift' ? '/networkattachmentdefinitions' : '/networks',
  });

  return [!loading && !error && Array.isArray(networks) ? networks : [], loading, error];
};

export const useOpenShiftNetworks = (
  provider: V1beta1Provider,
): [OpenShiftNetworkAttachmentDefinition[], boolean, Error] => {
  const isOpenShift = provider?.spec?.type === 'openshift';
  const {
    inventory: networks,
    loading,
    error,
  } = useProviderInventory<OpenShiftNetworkAttachmentDefinition[]>({
    provider,
    subPath: isOpenShift ? '/networkattachmentdefinitions' : '',
  });

  return [!loading && !error && Array.isArray(networks) ? networks : [], loading, error];
};
