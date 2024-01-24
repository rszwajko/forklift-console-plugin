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
  PlanExistingPlans,
  PlanName,
  PlanTargetNamespace,
  PlanTargetProvider,
  POD_NETWORK,
  SET_AVAILABLE_PROVIDERS,
  SET_AVAILABLE_TARGET_NAMESPACES,
  SET_AVAILABLE_TARGET_NETWORKS,
  SET_EXISTING_PLANS,
  SET_NAME,
  SET_TARGET_NAMESPACE,
  SET_TARGET_PROVIDER,
} from './actions';
import { Mapping } from './MappingList';

export interface CreateVmMigrationPageState {
  underConstruction: {
    plan: V1beta1Plan;
    netMap: V1beta1NetworkMap;
    storageMap: V1beta1StorageMap;
  };
  validationError: Error | null;
  apiError: Error | null;
  validation: {
    planName: Validation;
    targetNamespace: Validation;
    targetProvider: Validation;
  };
  existingResources: {
    providers: V1beta1Provider[];
    plans: V1beta1Plan[];
    targetNamespaces: OpenShiftNamespace[];
    targetNetworks: V1beta1NetworkMapSpecMapDestination[];
    targetStorages: unknown[];
  };
  calculatedOnce: {
    storagesUsedBySelectedVms: { [name: string]: unknown };
    networksUsedBySelectedVms: { [name: string]: unknown };
    vmFieldsFactory: [ResourceFieldFactory, FC<RowProps<VmData>>];
  };
  calculatedPerNamespace: {
    targetStorages: string[];
    targetNetworks: string[];
  };
  receivedAsParams: {
    selectedVms: VmData[];
  };
  workArea: {
    sourceNetworks: string[];
    sourceStorages: string[];
    networkMappings: Mapping[];
    storageMappings: Mapping[];
  };
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
    draft.underConstruction.plan.metadata.name = name;
    draft.validation.planName = validatePlanName(name, draft.existingResources.plans);
    return draft;
  },
  [SET_TARGET_NAMESPACE](
    draft,
    { payload: { targetNamespace } }: PageAction<CreateVmMigration, PlanTargetNamespace>,
  ) {
    draft.underConstruction.plan.spec.targetNamespace = targetNamespace;
    draft.validation.targetNamespace = validateTargetNamespace(
      targetNamespace,
      draft.existingResources.targetNamespaces,
    );
    setTargetNetworks(draft);
    return draft;
  },
  [SET_TARGET_PROVIDER](
    draft,
    { payload: { targetProviderName } }: PageAction<CreateVmMigration, PlanTargetProvider>,
  ) {
    setTargetProvider(draft, targetProviderName, draft.existingResources.providers);
    return draft;
  },
  [SET_AVAILABLE_PROVIDERS](
    draft,
    { payload: { availableProviders } }: PageAction<CreateVmMigration, PlanAvailableProviders>,
  ) {
    draft.existingResources.providers = availableProviders;
    // set the default provider if none is set
    // reset the provider if provider was removed
    if (
      !availableProviders
        .filter(getIsTarget)
        .find(
          (p) => p?.metadata?.name === draft.underConstruction.plan.spec.provider.destination?.name,
        )
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
    draft.existingResources.plans = existingPlans;
    draft.validation.planName = validatePlanName(
      draft.underConstruction.plan.metadata.name,
      existingPlans,
    );
    return draft;
  },
  [SET_AVAILABLE_TARGET_NAMESPACES](
    draft,
    {
      payload: { availableTargetNamespaces },
    }: PageAction<CreateVmMigration, PlanAvailableTargetNamespaces>,
  ) {
    const {
      existingResources,
      validation,
      underConstruction: { plan },
    } = draft;

    existingResources.targetNamespaces = availableTargetNamespaces;

    validation.targetNamespace = validateTargetNamespace(
      plan.spec.targetNamespace,
      availableTargetNamespaces,
    );
    if (validation.targetNamespace === 'success') {
      return draft;
    }

    const resolvedProvider = resolveTargetProvider(
      plan.spec.provider?.destination?.name,
      existingResources.providers,
    );
    plan.spec.targetNamespace =
      (isProviderLocalOpenshift(resolvedProvider) && plan.metadata.namespace) ||
      (availableTargetNamespaces.find((n) => n.name === DEFAULT_NAMESPACE) && DEFAULT_NAMESPACE) ||
      availableTargetNamespaces[0]?.name;

    validation.targetNamespace = validateTargetNamespace(
      plan.spec.targetNamespace,
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
    draft.existingResources.targetNetworks = networks;
    setTargetNetworks(draft);
    return draft;
  },
};

const setTargetNetworks = (draft: Draft<CreateVmMigrationPageState>): void => {
  const {
    calculatedPerNamespace,
    existingResources,
    underConstruction: { plan },
  } = draft;
  calculatedPerNamespace.targetNetworks = existingResources.targetNetworks
    .filter(({ namespace, type }) => namespace === plan.spec.targetNamespace || type === 'pod')
    .map(({ name }) => name);
};

const setTargetProvider = (
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
  if (plan.spec.provider?.destination?.name === targetProviderName) {
    // avoid side effects if no real change
    return draft;
  }
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
  calculatedPerNamespace.targetNetworks = [];
  calculatedPerNamespace.targetStorages = [];
  workArea.networkMappings = [];
  workArea.storageMappings = [];
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
