import { FC } from 'react';
import { Draft } from 'immer';
import { v4 as randomId } from 'uuid';

import { DefaultRow, ResourceFieldFactory, RowProps, withTr } from '@kubev2v/common';
import {
  OpenShiftNamespace,
  ProviderModelGroupVersionKind as ProviderGVK,
  ProviderType,
  V1beta1Plan,
  V1beta1Provider,
} from '@kubev2v/types';

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

import { POD_NETWORK } from './actions';
import { getNetworksUsedBySelectedVms } from './getNetworksUsedBySelectedVMs';
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

export const calculateNetworks = (
  draft: Draft<CreateVmMigrationPageState>,
): Partial<CreateVmMigrationPageState['calculatedPerNamespace']> => {
  const {
    calculatedPerNamespace: { networkMappings },
    existingResources,
    underConstruction: { plan },
  } = draft;

  const targetNetworkNameToUid = Object.fromEntries(
    existingResources.targetNetworks
      .filter(({ namespace }) => namespace === plan.spec.targetNamespace)
      .map((net) => [net.name, net.uid]),
  );
  const targetNetworkLabels = Object.keys(targetNetworkNameToUid).sort();
  const defaultDestination = POD_NETWORK;

  const allSourceNetworks = draft.calculatedOnce.networkIdsUsedBySelectedVms;

  const validMappings = networkMappings.filter(
    ({ source, destination }) =>
      targetNetworkNameToUid[destination] && allSourceNetworks.find((net) => net === source),
  );

  const sourceNetworksToBeMapped = allSourceNetworks.filter(
    (net) => !validMappings.find(({ source }) => net === source),
  );

  if (validMappings.length === networkMappings.length && networkMappings.length) {
    // existing mappings are valid after this reload
    return {
      targetNetworkLabels,
      sourceNetworkLabels: sourceNetworksToBeMapped,
    };
  } else if (!networkMappings.length) {
    // no mappings yet- generate using defaults
    return {
      // all source networks covered with defaults
      sourceNetworkLabels: [],
      targetNetworkLabels,
      networkMappings: allSourceNetworks.map((source) => ({
        source,
        destination: defaultDestination,
      })),
    };
  } else {
    // remove invalid mappings
    // user will need to provide them manually (to avoid overriding user choice silently)
    return {
      // only networks that are not already in the mappings
      sourceNetworkLabels: sourceNetworksToBeMapped,
      targetNetworkLabels,
      networkMappings: validMappings,
    };
  }
  return {};
};

export const calculateStorages = (
  draft: Draft<CreateVmMigrationPageState>,
): Partial<CreateVmMigrationPageState['calculatedPerNamespace']> => ({});

export const setTargetProvider = (
  draft: Draft<CreateVmMigrationPageState>,
  targetProviderName: string,
  availableProviders: V1beta1Provider[],
) => {
  const {
    existingResources,
    validation,
    underConstruction: { plan },
    workArea,
  } = draft;

  // reset props that depend on the target provider
  plan.spec.targetNamespace = undefined;
  // temporarily assume no namespace is OK - the validation will continue when new namespaces are loaded
  validation.targetNamespace = 'default';
  existingResources.targetNamespaces = [];
  existingResources.targetNetworks = [];
  existingResources.targetStorages = [];
  draft.calculatedPerNamespace = initCalculatedPerNamespaceSlice();

  // there might be no target provider in the namespace
  const resolvedTarget = resolveTargetProvider(targetProviderName, availableProviders);
  validation.targetProvider = resolvedTarget ? 'success' : 'error';
  plan.spec.provider.destination = resolvedTarget && getObjectRef(resolvedTarget);
  workArea.targetProvider = resolvedTarget;
};

export const setTargetNamespace = (
  draft: Draft<CreateVmMigrationPageState>,
  targetNamespace: string,
): void => {
  const {
    underConstruction: { plan },
  } = draft;

  plan.spec.targetNamespace = targetNamespace;
  draft.validation.targetNamespace = validateTargetNamespace(
    targetNamespace,
    draft.existingResources.targetNamespaces,
  );

  draft.calculatedPerNamespace = initCalculatedPerNamespaceSlice();
  draft.calculatedPerNamespace = {
    ...draft.calculatedPerNamespace,
    ...calculateNetworks(draft),
    ...calculateStorages(draft),
  };
};

export const initCalculatedPerNamespaceSlice =
  (): CreateVmMigrationPageState['calculatedPerNamespace'] => ({
    targetNetworkLabels: [],
    targetStorages: [],
    networkMappings: [],
    storageMappings: [],
    sourceStorages: [],
    sourceNetworkLabels: [],
    targetNetworkLabelToId: {},
  });

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
  sourceProvider = {
    metadata: { name: 'unknown', namespace: 'unknown' },
    apiVersion: `${ProviderGVK.group}/${ProviderGVK.version}`,
    kind: ProviderGVK.kind,
  },
  selectedVms = [],
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
    targetNetworks: [],
    sourceNetworks: [],
    targetStorages: [],
    nickProfiles: [],
  },
  receivedAsParams: {
    selectedVms,
    sourceProvider,
    namespace,
  },
  validation: {
    planName: 'default',
    targetNamespace: 'default',
    targetProvider: 'default',
  },
  calculatedOnce: {
    vmFieldsFactory: resourceFieldsForType(sourceProvider?.spec?.type as ProviderType),
    networkIdsUsedBySelectedVms:
      sourceProvider.spec?.type !== 'ovirt' ? getNetworksUsedBySelectedVms(selectedVms, []) : [],
    sourceNetworkLabelToId: {},
    storagesUsedBySelectedVms: ['ovirt', 'openstack'].includes(sourceProvider.spec?.type) ? [] : [],
  },
  calculatedPerNamespace: {
    targetNetworkLabels: [],
    targetNetworkLabelToId: {},
    targetStorages: [],
    sourceNetworkLabels: [],
    networkMappings: [],
    sourceStorages: [],
    storageMappings: [],
  },
  workArea: {
    targetProvider: undefined,
  },
  loaded: {
    nickProfiles: sourceProvider.spec?.type !== 'ovirt',
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
