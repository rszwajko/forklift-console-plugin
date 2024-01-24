import { FC } from 'react';
import { Draft } from 'immer';
import { v4 as randomId } from 'uuid';

import { DefaultRow, ResourceFieldFactory, RowProps, withTr } from '@kubev2v/common';
import { OpenShiftNamespace, ProviderType, V1beta1Plan, V1beta1Provider } from '@kubev2v/types';

import { getIsTarget, validateK8sName } from '../../utils';
import { networkMapTemplate, planTemplate, storageMapTemplate } from '../create/templates';
import { toId, VmData } from '../details';
import { openShiftVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OpenShiftVirtualMachinesList';
import { OpenShiftVirtualMachinesCells } from '../details/tabs/VirtualMachines/OpenShiftVirtualMachinesRow';
import { openStackVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OpenStackVirtualMachinesList';
import { OpenStackVirtualMachinesCells } from '../details/tabs/VirtualMachines/OpenStackVirtualMachinesRow';
import { ovaVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OvaVirtualMachinesList';
import { OvaVirtualMachinesCells } from '../details/tabs/VirtualMachines/OvaVirtualMachinesRow';
import { oVirtVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OVirtVirtualMachinesList';
import { OVirtVirtualMachinesCells } from '../details/tabs/VirtualMachines/OVirtVirtualMachinesRow';
import { vSphereVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/VSphereVirtualMachinesList';
import { VSphereVirtualMachinesCells } from '../details/tabs/VirtualMachines/VSphereVirtualMachinesRow';

import { CreateVmMigrationPageState } from './reducer';

export const validateUniqueName = (name: string, existingPlanNames: string[]) =>
  existingPlanNames.every((existingName) => existingName !== name);

export const validatePlanName = (name: string, existingPlans: V1beta1Plan[]) =>
  validateK8sName(name) &&
  validateUniqueName(
    name,
    existingPlans.map((plan) => plan?.metadata?.name ?? ''),
  )
    ? 'success'
    : 'error';

export const validateTargetNamespace = (
  namespace: string,
  availableNamespaces: OpenShiftNamespace[],
) =>
  validateK8sName(namespace) && availableNamespaces?.find((n) => n.name === namespace)
    ? 'success'
    : 'error';

export const calculateNetworks = (draft: Draft<CreateVmMigrationPageState>): void => {
  const {
    calculatedPerNamespace,
    existingResources,
    workArea,
    underConstruction: { plan },
  } = draft;
  calculatedPerNamespace.targetNetworks = existingResources.targetNetworks
    .filter(({ namespace, type }) => namespace === plan.spec.targetNamespace || type === 'pod')
    .map(({ name }) => name);
  const sourceNetworks = Object.keys(draft.calculatedOnce.networksUsedBySelectedVms);
  const defaultDestination = calculatedPerNamespace.targetNetworks[0];
  workArea.networkMappings = sourceNetworks.map((source) => ({
    source,
    destination: defaultDestination,
  }));
};

export const calculateStorages = (draft: Draft<CreateVmMigrationPageState>): void => undefined;

export const setTargetProvider = (
  draft: Draft<CreateVmMigrationPageState>,
  targetProviderName: string,
  availableProviders: V1beta1Provider[],
) => {
  const {
    calculatedPerNamespace,
    existingResources,
    validation,
    underConstruction: { plan },
    workArea,
  } = draft;

  // there might be no target provider in the namespace
  const resolvedTarget = resolveTargetProvider(targetProviderName, availableProviders);
  validation.targetProvider = resolvedTarget ? 'success' : 'error';
  plan.spec.provider.destination = resolvedTarget && getObjectRef(resolvedTarget);

  // reset props that depend on the target provider
  plan.spec.targetNamespace = undefined;
  // temporarily assume no namespace is OK - the validation will continue when new namespaces are loaded
  validation.targetNamespace = 'default';
  existingResources.targetNamespaces = [];
  existingResources.targetNetworks = [];
  existingResources.targetStorages = [];
  clearCalculatedPerNamespaceSlice(calculatedPerNamespace);
  clearWorkAreaSlice(workArea);
};

export const clearCalculatedPerNamespaceSlice = (
  calculatedPerNamespace: CreateVmMigrationPageState['calculatedPerNamespace'],
) => {
  calculatedPerNamespace.targetNetworks = [];
  calculatedPerNamespace.targetStorages = [];
};

export const clearWorkAreaSlice = (workArea: CreateVmMigrationPageState['workArea']) => {
  workArea.networkMappings = [];
  workArea.storageMappings = [];
  workArea.sourceStorages = [];
  workArea.sourceStorages = [];
};

export const resolveTargetProvider = (name: string, availableProviders: V1beta1Provider[]) =>
  availableProviders.filter(getIsTarget).find((p) => p?.metadata?.name === name);

// based on the method used in legacy/src/common/helpers
// and mocks/src/definitions/utils
export const getObjectRef = (
  { apiVersion, kind, metadata: { name, namespace, uid } = {} }: V1beta1Provider = {
    apiVersion: undefined,
    kind: undefined,
  },
) => ({
  apiVersion,
  kind,
  name,
  namespace,
  uid,
});

export const createInitialState = ({
  namespace,
  sourceProvider,
  selectedVms,
}: {
  namespace: string;
  sourceProvider: V1beta1Provider;
  selectedVms: VmData[];
}): CreateVmMigrationPageState => ({
  underConstruction: {
    plan: {
      ...planTemplate,
      metadata: {
        ...planTemplate?.metadata,
        name: `${sourceProvider.metadata.name}-${randomId().substring(0, 8)}`,
        namespace,
      },
      spec: {
        ...planTemplate?.spec,
        provider: {
          source: getObjectRef(sourceProvider),
          destination: undefined,
        },
        targetNamespace: undefined,
        vms: selectedVms.map((data) => ({ name: data.name, id: toId(data) })),
      },
    },
    netMap: {
      ...networkMapTemplate,
      metadata: {
        ...networkMapTemplate?.metadata,
        name: `${sourceProvider.metadata.name}-${randomId().substring(0, 8)}`,
        namespace,
      },
    },
    storageMap: {
      ...storageMapTemplate,
      metadata: {
        ...storageMapTemplate?.metadata,
        name: `${sourceProvider.metadata.name}-${randomId().substring(0, 8)}`,
        namespace,
      },
    },
  },
  validationError: null,
  apiError: null,
  existingResources: {
    plans: [],
    providers: [],
    targetNamespaces: [],
    targetNetworks: [{ name: 'foo2', type: 'multus' }],
    targetStorages: [],
  },
  receivedAsParams: {
    selectedVms,
  },
  validation: {
    planName: 'default',
    targetNamespace: 'default',
    targetProvider: 'default',
  },
  calculatedOnce: {
    vmFieldsFactory: resourceFieldsForType(sourceProvider?.spec?.type as ProviderType),
    networksUsedBySelectedVms: extractUniqueNetworks(selectedVms),
    storagesUsedBySelectedVms: {},
  },
  calculatedPerNamespace: {
    targetNetworks: ['foo2', 'bar2'],
    targetStorages: [],
  },
  workArea: {
    sourceNetworks: ['foo', 'bar'],
    networkMappings: [{ source: 'foo', destination: 'foo2' }],
    sourceStorages: [],
    storageMappings: [],
  },
});

export const extractUniqueNetworks = (vms: VmData[]): { [name: string]: unknown } => ({});

export const resourceFieldsForType = (
  type: ProviderType,
): [ResourceFieldFactory, FC<RowProps<VmData>>] => {
  switch (type) {
    case 'openshift':
      return [openShiftVmFieldsMetadataFactory, withTr(OpenShiftVirtualMachinesCells)];
    case 'openstack':
      return [openStackVmFieldsMetadataFactory, withTr(OpenStackVirtualMachinesCells)];
    case 'ova':
      return [ovaVmFieldsMetadataFactory, withTr(OvaVirtualMachinesCells)];
    case 'ovirt':
      return [oVirtVmFieldsMetadataFactory, withTr(OVirtVirtualMachinesCells)];
    case 'vsphere':
      return [vSphereVmFieldsMetadataFactory, withTr(VSphereVirtualMachinesCells)];
    default:
      return [() => [], DefaultRow];
  }
};
