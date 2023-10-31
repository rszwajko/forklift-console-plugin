import React from 'react';

import { EnumToTuple, ResourceFieldFactory } from '@kubev2v/common';

import { ProviderVirtualMachinesList, VmData } from './components';
import { OpenShiftVirtualMachinesRow } from './OpenShiftVirtualMachinesRow';
import { ProviderVirtualMachinesProps } from './ProviderVirtualMachines';
import { getOpenShiftFeatureMap, getVmPowerState } from './utils';

const openShiftVmFieldsMetadataFactory: ResourceFieldFactory = (t) => [
  {
    resourceFieldId: 'name',
    jsonPath: '$.name',
    label: t('Name'),
    isVisible: true,
    isIdentity: true, // Name is sufficient ID when Namespace is pre-selected
    filter: {
      type: 'freetext',
      placeholderLabel: t('Filter by name'),
    },
    sortable: true,
  },
  {
    resourceFieldId: 'status',
    jsonPath: (data: VmData) => getVmPowerState(data?.vm),
    label: t('Status'),
    isVisible: true,
    isIdentity: false,
    filter: {
      type: 'enum',
      placeholderLabel: t('Filter by status'),
      values: EnumToTuple({ off: 'Off', on: 'On', unknown: 'Unknown' }),
    },
    sortable: true,
  },
  {
    resourceFieldId: 'features',
    jsonPath: (data: VmData) => getOpenShiftFeatureMap(data?.vm),
    label: t('Features'),
    isVisible: true,
    isIdentity: false,
    filter: {
      type: 'enum',
      placeholderLabel: t('Filter by features'),
      values: EnumToTuple({
        numa: t('NUMA'),
        gpus: t('GPUs'),
        hostDevices: t('Host Devices'),
        persistentTpm: t('Persistent TPM'),
        persistentEfi: t('Persistent EFI'),
        dedicatedCpu: t('Dedicated CPU'),
      }),
    },
    sortable: true,
  },
  {
    resourceFieldId: 'template',
    jsonPath: "$.vm.object.metadata.labels['vm.kubevirt.io/template']",
    label: t('Template'),
    isVisible: true,
    isIdentity: false,
    filter: {
      type: 'freetext',
      placeholderLabel: t('Filter by template'),
    },
    sortable: true,
  },
];

export const OpenShiftVirtualMachinesList: React.FC<ProviderVirtualMachinesProps> = ({
  obj,
  loaded,
  loadError,
}) => (
  <ProviderVirtualMachinesList
    obj={obj}
    loaded={loaded}
    loadError={loadError}
    rowMapper={OpenShiftVirtualMachinesRow}
    fieldsMetadataFactory={openShiftVmFieldsMetadataFactory}
    pageId="OpenShiftVirtualMachinesList"
  />
);
