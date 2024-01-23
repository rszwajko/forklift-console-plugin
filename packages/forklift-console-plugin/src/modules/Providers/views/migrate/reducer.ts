import { FC } from 'react';
import { Draft } from 'immer';
import { isProviderLocalOpenshift } from 'src/utils/resources';
import { v4 as randomId } from 'uuid';

import { DefaultRow, ResourceFieldFactory, RowProps, withTr } from '@kubev2v/common';
import {
  OpenShiftNamespace,
  ProviderType,
  V1beta1NetworkMap,
  V1beta1Plan,
  V1beta1Provider,
  V1beta1StorageMap,
} from '@kubev2v/types';
import { V1beta1NetworkMapSpecMapDestination } from '@kubev2v/types/dist/models/V1beta1NetworkMapSpecMapDestination';

import { getIsTarget, validateK8sName, Validation } from '../../utils';
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

import {
  CreateVmMigration,
  DEFAULT_NAMESPACE,
  PageAction,
  PlanAvailableProviders,
  PlanAvailableTargetNamespaces,
  PlanAvailableTargetNetworks,
  PlanDescription,
  PlanExistingPlans,
  PlanName,
  PlanTargetNamespace,
  PlanTargetProvider,
  POD_NETWORK,
  SET_AVAILABLE_PROVIDERS,
  SET_AVAILABLE_TARGET_NAMESPACES,
  SET_AVAILABLE_TARGET_NETWORKS,
  SET_DESCRIPTION,
  SET_EXISTING_PLANS,
  SET_NAME,
  SET_TARGET_NAMESPACE,
  SET_TARGET_PROVIDER,
} from './actions';
import { Mapping } from './MappingList';

export interface CreateVmMigrationPageState {
  newPlan: V1beta1Plan;
  newNetMap: V1beta1NetworkMap;
  newStorageMap: V1beta1StorageMap;
  validationError: Error | null;
  apiError: Error | null;
  validation: {
    name: Validation;
    targetNamespace: Validation;
    targetProvider: Validation;
  };
  availableProviders: V1beta1Provider[];
  selectedVms: VmData[];
  existingPlans: V1beta1Plan[];
  vmFieldsFactory: [ResourceFieldFactory, FC<RowProps<VmData>>];
  availableTargetNamespaces: OpenShiftNamespace[];
  sourceNetworks: string[];
  targetNetworks: string[];
  networkMappings: Mapping[];
  availableTargetNetworks: V1beta1NetworkMapSpecMapDestination[];
  networksUsedBySelectedVms: { [name: string]: unknown };
  sourceStorages: string[];
  targetStorages: string[];
  storageMappings: Mapping[];
  availableTargetStorages: { [name: string]: unknown };
  storagesUsedBySelectedVms: { [name: string]: unknown };
}

const validateUniqueName = (name: string, existingPlanNames: string[]) =>
  existingPlanNames.every((existingName) => existingName !== name);

const validatePlanName = (name: string, existingPlans: V1beta1Plan[]) =>
  validateK8sName(name) &&
  validateUniqueName(
    name,
    existingPlans.map((plan) => plan?.metadata?.name ?? ''),
  )
    ? 'success'
    : 'error';

const validateTargetNamespace = (namespace: string, availableNamespaces: OpenShiftNamespace[]) =>
  validateK8sName(namespace) && availableNamespaces?.find((n) => n.name === namespace)
    ? 'success'
    : 'error';

const actions: {
  [name: string]: (
    draft: Draft<CreateVmMigrationPageState>,
    action: PageAction<CreateVmMigration, unknown>,
  ) => CreateVmMigrationPageState;
} = {
  [SET_NAME](draft, { payload: { name } }: PageAction<CreateVmMigration, PlanName>) {
    draft.newPlan.metadata.name = name;
    draft.validation.name = validatePlanName(name, draft.existingPlans);
    return draft;
  },
  [SET_DESCRIPTION](
    draft,
    { payload: { description } }: PageAction<CreateVmMigration, PlanDescription>,
  ) {
    draft.newPlan.spec.description = description;
    return draft;
  },
  [SET_TARGET_NAMESPACE](
    draft,
    { payload: { targetNamespace } }: PageAction<CreateVmMigration, PlanTargetNamespace>,
  ) {
    draft.newPlan.spec.targetNamespace = targetNamespace;
    draft.validation.targetNamespace = validateTargetNamespace(
      targetNamespace,
      draft.availableTargetNamespaces,
    );
    setTargetNetworks(draft);
    return draft;
  },
  [SET_TARGET_PROVIDER](
    draft,
    { payload: { targetProviderName } }: PageAction<CreateVmMigration, PlanTargetProvider>,
  ) {
    setTargetProvider(draft, targetProviderName, draft.availableProviders);
    return draft;
  },
  [SET_AVAILABLE_PROVIDERS](
    draft,
    { payload: { availableProviders } }: PageAction<CreateVmMigration, PlanAvailableProviders>,
  ) {
    draft.availableProviders = availableProviders;
    // set the default provider if none is set
    // reset the provider if provider was removed
    if (
      !availableProviders
        .filter(getIsTarget)
        .find((p) => p?.metadata?.name === draft.newPlan.spec.provider.destination?.name)
    ) {
      const firstHostProvider = availableProviders.find((p) => isProviderLocalOpenshift(p));
      setTargetProvider(draft, firstHostProvider?.metadata?.name, availableProviders);
    }
    return draft;
  },
  [SET_EXISTING_PLANS](
    draft,
    { payload: { existingPlans } }: PageAction<CreateVmMigration, PlanExistingPlans>,
  ) {
    draft.existingPlans = existingPlans;
    draft.validation.name = validatePlanName(draft.newPlan.metadata.name, existingPlans);
    return draft;
  },
  [SET_AVAILABLE_TARGET_NAMESPACES](
    draft,
    {
      payload: { availableTargetNamespaces },
    }: PageAction<CreateVmMigration, PlanAvailableTargetNamespaces>,
  ) {
    draft.availableTargetNamespaces = availableTargetNamespaces;

    draft.validation.targetNamespace = validateTargetNamespace(
      draft.newPlan.spec.targetNamespace,
      availableTargetNamespaces,
    );
    if (draft.validation.targetNamespace === 'success') {
      return draft;
    }

    const resolvedProvider = resolveTargetProvider(
      draft.newPlan.spec.provider?.destination?.name,
      draft.availableProviders,
    );
    draft.newPlan.spec.targetNamespace =
      (isProviderLocalOpenshift(resolvedProvider) && draft.newPlan.metadata.namespace) ||
      (availableTargetNamespaces.find((n) => n.name === DEFAULT_NAMESPACE) && DEFAULT_NAMESPACE) ||
      availableTargetNamespaces[0]?.name;

    draft.validation.targetNamespace = validateTargetNamespace(
      draft.newPlan.spec.targetNamespace,
      availableTargetNamespaces,
    );
    return draft;
  },
  [SET_AVAILABLE_TARGET_NETWORKS](
    draft,
    {
      payload: { availableTargetNetworks },
    }: PageAction<CreateVmMigration, PlanAvailableTargetNetworks>,
  ) {
    const networks: V1beta1NetworkMapSpecMapDestination[] = [
      { type: 'pod', name: POD_NETWORK },
      ...availableTargetNetworks.map(
        ({ type, ...rest }) =>
          ({
            ...rest,
            type: type ?? 'multus',
          } as V1beta1NetworkMapSpecMapDestination),
      ),
    ];
    // .filter(({ namespace }) => namespace === draft.newPlan.spec.targetNamespace),
    draft.availableTargetNetworks = networks;
    setTargetNetworks(draft);
    return draft;
  },
};

const setTargetNetworks = (draft: Draft<CreateVmMigrationPageState>) => {
  draft.targetNetworks = draft.availableTargetNetworks
    .filter(
      ({ namespace, type }) => namespace === draft.newPlan.spec.targetNamespace || type === 'pod',
    )
    .map(({ name }) => name);
};

const setTargetProvider = (
  draft: Draft<CreateVmMigrationPageState>,
  targetProviderName: string,
  availableProviders: V1beta1Provider[],
) => {
  if (draft.newPlan.spec.provider?.destination?.name === targetProviderName) {
    // avoid side effects if no real change
    return draft;
  }
  // there might be no target provider in the namespace
  const resolvedTarget = resolveTargetProvider(targetProviderName, availableProviders);
  draft.newPlan.spec.provider.destination = resolvedTarget && getObjectRef(resolvedTarget);
  // assume the value is correct and wait until the namespaces will be loaded for further validation
  draft.newPlan.spec.targetNamespace = undefined;
  draft.validation.targetNamespace = 'default';
  draft.availableTargetNamespaces = [];
  draft.availableTargetNetworks = [];
  draft.networkMappings = [];
  draft.validation.targetProvider = resolvedTarget ? 'success' : 'error';
};

const resolveTargetProvider = (name: string, availableProviders: V1beta1Provider[]) =>
  availableProviders.filter(getIsTarget).find((p) => p?.metadata?.name === name);

export const reducer = (
  draft: Draft<CreateVmMigrationPageState>,
  action: PageAction<CreateVmMigration, unknown>,
) => {
  return actions?.[action?.type]?.(draft, action) ?? draft;
};

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
  newPlan: {
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
  newNetMap: {
    ...networkMapTemplate,
    metadata: {
      ...networkMapTemplate?.metadata,
      name: `${sourceProvider.metadata.name}-${randomId().substring(0, 8)}`,
      namespace,
    },
  },
  newStorageMap: {
    ...storageMapTemplate,
    metadata: {
      ...storageMapTemplate?.metadata,
      name: `${sourceProvider.metadata.name}-${randomId().substring(0, 8)}`,
      namespace,
    },
  },
  validationError: null,
  apiError: null,
  availableProviders: [],
  selectedVms,
  existingPlans: [],
  validation: {
    name: 'default',
    targetNamespace: 'default',
    targetProvider: 'default',
  },
  vmFieldsFactory: resourceFieldsForType(sourceProvider?.spec?.type as ProviderType),
  availableTargetNamespaces: [],
  sourceNetworks: ['foo', 'bar'],
  targetNetworks: ['foo2', 'bar2'],
  networkMappings: [{ source: 'foo', destination: 'foo2' }],
  availableTargetNetworks: [{ name: 'foo2', type: 'multus' }],
  networksUsedBySelectedVms: extractUniqueNetworks(selectedVms),
  sourceStorages: [],
  targetStorages: [],
  storageMappings: [],
  availableTargetStorages: {},
  storagesUsedBySelectedVms: {},
});

const extractUniqueNetworks = (vms: VmData[]): { [name: string]: unknown } => ({});

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
