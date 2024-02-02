import { FC } from 'react';

import { ResourceFieldFactory, RowProps } from '@kubev2v/common';
import {
  OpenShiftNamespace,
  OpenshiftResource,
  OpenShiftStorageClass,
  OpenstackVolume,
  OVirtDisk,
  OVirtNicProfile,
  V1beta1NetworkMap,
  V1beta1Plan,
  V1beta1Provider,
  V1beta1StorageMap,
} from '@kubev2v/types';

import { InventoryNetwork } from '../../hooks/useNetworks';
import { InventoryStorage } from '../../hooks/useStorages';
import { Validation } from '../../utils';
import { VmData } from '../details';

export interface CreateVmMigrationPageState {
  underConstruction: {
    plan: V1beta1Plan;
    netMap: V1beta1NetworkMap;
    storageMap: V1beta1StorageMap;
  };

  validation: {
    planName: Validation;
    targetNamespace: Validation;
    targetProvider: Validation;
  };
  // data fetched from k8s or inventory
  existingResources: {
    providers: V1beta1Provider[];
    plans: V1beta1Plan[];
    targetNamespaces: OpenShiftNamespace[];
    targetNetworks: OpenshiftResource[];
    sourceNetworks: InventoryNetwork[];
    targetStorages: OpenShiftStorageClass[];
    sourceStorages: InventoryStorage[];
    nickProfiles: OVirtNicProfile[];
    disks: (OVirtDisk | OpenstackVolume)[];
    netMaps: V1beta1NetworkMap[];
  };
  calculatedOnce: {
    // calculated on start (exception:for ovirt/openstack we need to fetch disks)
    storageIdsUsedBySelectedVms: string[];
    sourceStorageLabelToId: { [label: string]: string };
    // calculated on start (exception:for ovirt we need to fetch nic profiles)
    networkIdsUsedBySelectedVms: string[];
    sourceNetworkLabelToId: { [label: string]: string };
    // calculated on start
    vmFieldsFactory: [ResourceFieldFactory, FC<RowProps<VmData>>];
  };
  // re-calculated on every target namespace change
  calculatedPerNamespace: {
    // read-only
    targetStorages: string[];
    // read-only, human-readable
    targetNetworks: string[];
    targetNetworkLabelToId: { [label: string]: string };
    sourceNetworks: MappingSource[];
    sourceStorages: MappingSource[];
    // mutated, both source and destination human-readable
    networkMappings: Mapping[];
    storageMappings: Mapping[];
  };
  receivedAsParams: {
    selectedVms: VmData[];
    sourceProvider: V1beta1Provider;
    namespace: string;
  };
  // placeholder for helper data
  workArea: {
    targetProvider: V1beta1Provider;
  };
  flow: {
    editingDone: boolean;
    validationError: Error | null;
    apiError?: Error;
  };
}
export interface MappingSource {
  // read-only
  label: string;
  usedBySelectedVms: boolean;
  // mutated via UI
  isMapped: boolean;
}

export interface Mapping {
  source: string;
  destination: string;
}
