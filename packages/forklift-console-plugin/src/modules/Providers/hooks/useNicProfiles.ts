import { useMemo } from 'react';

import { OVirtNicProfile, V1beta1Provider } from '@kubev2v/types';

import useProviderInventory from './useProviderInventory';

/**
 * Works only for oVirt
 */
export const useNicProfiles = (provider: V1beta1Provider): [OVirtNicProfile[], boolean, Error] => {
  const isOVirt = provider?.spec?.type === 'ovirt';
  const {
    inventory: nicProfiles,
    loading,
    error,
  } = useProviderInventory<OVirtNicProfile[]>({
    provider,
    subPath: isOVirt ? '/nicprofiles?detail=1' : '',
  });

  const stable = useMemo(
    () => (!isOVirt ? [] : Array.isArray(nicProfiles) ? nicProfiles : []),
    [isOVirt, nicProfiles],
  );

  return [stable, loading, error];
};
