import {
  OpenstackVM,
  OVirtVM,
  ProviderType,
  ProviderVirtualMachine,
  VSphereVM,
} from '@kubev2v/types';

// moved from packages/legacy/src/common/components/VMNameWithPowerState.tsx
export const getVmPowerState = (
  providerType: ProviderType,
  vm?: ProviderVirtualMachine,
): 'on' | 'off' | 'unknown' => {
  let powerStatus: 'on' | 'off' | 'unknown' = 'unknown';
  if (!vm) return powerStatus;
  switch (providerType) {
    case 'ovirt': {
      if ((vm as OVirtVM).status === 'up') powerStatus = 'on';
      if ((vm as OVirtVM).status === 'down') powerStatus = 'off';
      break;
    }
    case 'vsphere': {
      if ((vm as VSphereVM).powerState === 'poweredOn') powerStatus = 'on';
      if ((vm as VSphereVM).powerState === 'poweredOff') powerStatus = 'off';
      break;
    }
    case 'openstack': {
      const status = (vm as OpenstackVM).status;
      if (status === 'ACTIVE') {
        powerStatus = 'on';
      }
      if (status === 'SHUTOFF') {
        powerStatus = 'off';
      }
      break;
    }
    case 'openshift': {
      // TODO object from Inventory is missing fields
      // const status = (vm as OpenshiftVM)?.status?.printableStatus;
      // if (status === 'Running') {
      powerStatus = 'on';
      // } else {
      // powerStatus = 'off';
      // }
      break;
    }
    case 'ova': {
      powerStatus = 'off';
      break;
    }
    default: {
      powerStatus = 'unknown';
    }
  }
  return powerStatus;
};
