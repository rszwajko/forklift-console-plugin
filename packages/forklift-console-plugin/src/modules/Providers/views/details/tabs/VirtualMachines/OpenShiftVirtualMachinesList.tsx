import React from 'react';

import { ResourceFieldFactory } from '@kubev2v/common';

import { ProviderVirtualMachinesList } from './components/ProviderVirtualMachinesList';
import { OpenShiftVirtualMachinesRow } from './OpenShiftVirtualMachinesRow';
import { ProviderVirtualMachinesProps } from './ProviderVirtualMachines';

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
