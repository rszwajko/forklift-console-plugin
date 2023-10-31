import { ProviderVirtualMachine, V1DomainSpec } from '@kubev2v/types';

export const getOpenShiftFeatureMap = (vm: ProviderVirtualMachine) => {
  if (vm.providerType !== 'openshift') {
    return {};
  }
  const domain: V1DomainSpec = vm.object?.spec?.template?.spec?.domain;
  if (!domain) {
    return {};
  }

  return {
    numa: !!domain.cpu?.numa,
    gpus: !!domain.devices?.gpus?.length,
    hostDevices: !!domain?.devices?.hostDevices?.length,
    persistentTpm: domain?.devices?.tpm?.persistent,
    persistentEfi: domain?.firmware?.bootloader?.efi?.persistent,
    dedicatedCpu: domain?.cpu?.dedicatedCpuPlacement,
  };
};
