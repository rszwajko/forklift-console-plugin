import { FC } from 'react';
import { Draft } from 'immer';
import { isProviderLocalOpenshift } from 'src/utils/resources';

import { ResourceFieldFactory, RowProps } from '@kubev2v/common';
import {
  OpenShiftNamespace,
  V1beta1NetworkMap,
  V1beta1Plan,
  V1beta1Provider,
  V1beta1StorageMap,
} from '@kubev2v/types';
import { V1beta1NetworkMapSpecMapDestination } from '@kubev2v/types/dist/models/V1beta1NetworkMapSpecMapDestination';
import { V1beta1NetworkMapSpecMapSource } from '@kubev2v/types/dist/models/V1beta1NetworkMapSpecMapSource';

import { getIsTarget, Validation } from '../../utils';
import { VmData } from '../details';

import {
  CreateVmMigration,
  DEFAULT_NAMESPACE,
  PageAction,
  PlanAvailableProviders,
  PlanAvailableSourceNetworks,
  PlanAvailableTargetNamespaces,
  PlanAvailableTargetNetworks,
  PlanExistingPlans,
  PlanName,
  PlanTargetNamespace,
  PlanTargetProvider,
  POD_NETWORK,
  SET_AVAILABLE_PROVIDERS,
  SET_AVAILABLE_SOURCE_NETWORKS,
  SET_AVAILABLE_TARGET_NAMESPACES,
  SET_AVAILABLE_TARGET_NETWORKS,
  SET_EXISTING_PLANS,
  SET_NAME,
  SET_TARGET_NAMESPACE,
  SET_TARGET_PROVIDER,
} from './actions';
import { Mapping } from './MappingList';
import {
  calculateNetworks,
  setTargetNamespace,
  setTargetProvider,
  validatePlanName,
  validateTargetNamespace,
} from './stateHelpers';

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
  // data fetched from k8s or inventory
  existingResources: {
    providers: V1beta1Provider[];
    plans: V1beta1Plan[];
    targetNamespaces: OpenShiftNamespace[];
    targetNetworks: V1beta1NetworkMapSpecMapDestination[];
    sourceNetworks: V1beta1NetworkMapSpecMapSource[];
    targetStorages: unknown[];
  };
  // calculated on start from the received params
  calculatedOnce: {
    storagesUsedBySelectedVms: { [name: string]: unknown };
    networksUsedBySelectedVms: { [name: string]: unknown };
    vmFieldsFactory: [ResourceFieldFactory, FC<RowProps<VmData>>];
  };
  // re-calculated on every target namespace change
  calculatedPerNamespace: {
    // read-only
    targetStorages: string[];
    targetNetworks: string[];
    // mutated
    sourceNetworks: string[];
    sourceStorages: string[];
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
}

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
    setTargetNamespace(draft, targetNamespace);
    return draft;
  },
  [SET_TARGET_PROVIDER](
    draft,
    { payload: { targetProviderName } }: PageAction<CreateVmMigration, PlanTargetProvider>,
  ) {
    const {
      underConstruction: { plan },
      existingResources,
    } = draft;
    // avoid side effects if no real change
    if (plan.spec.provider?.destination?.name !== targetProviderName) {
      setTargetProvider(draft, targetProviderName, existingResources.providers);
    }
    return draft;
  },
  [SET_AVAILABLE_PROVIDERS](
    draft,
    { payload: { availableProviders } }: PageAction<CreateVmMigration, PlanAvailableProviders>,
  ) {
    draft.existingResources.providers = availableProviders;
    if (
      !availableProviders
        .filter(getIsTarget)
        .find(
          (p) => p?.metadata?.name === draft.underConstruction.plan.spec.provider.destination?.name,
        )
    ) {
      // the current provider is missing in the list of available providers
      // possible cases:
      // 1. no provider set (yet)
      // 2. provider got removed in the meantime
      // 3. no host provider in the namespace
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
      workArea: { targetProvider },
    } = draft;

    existingResources.targetNamespaces = availableTargetNamespaces;

    validation.targetNamespace = validateTargetNamespace(
      plan.spec.targetNamespace,
      availableTargetNamespaces,
    );
    if (validation.targetNamespace === 'success') {
      return draft;
    }

    const targetNamespace =
      // use the current namespace (inherited from source provider)
      (isProviderLocalOpenshift(targetProvider) && plan.metadata.namespace) ||
      // use 'default' if exists
      (availableTargetNamespaces.find((n) => n.name === DEFAULT_NAMESPACE) && DEFAULT_NAMESPACE) ||
      // use the first from the list (if exists)
      availableTargetNamespaces[0]?.name;

    setTargetNamespace(draft, targetNamespace);
    return draft;
  },
  [SET_AVAILABLE_TARGET_NETWORKS](
    draft,
    {
      payload: { availableTargetNetworks },
    }: PageAction<CreateVmMigration, PlanAvailableTargetNetworks>,
  ) {
    const networks: V1beta1NetworkMapSpecMapDestination[] = [
      // first network is used as default
      { type: 'pod', name: POD_NETWORK },
      ...availableTargetNetworks.map(
        ({ type, ...rest }) =>
          ({
            ...rest,
            type: type ?? 'multus',
          } as V1beta1NetworkMapSpecMapDestination),
      ),
    ];
    draft.existingResources.targetNetworks = networks;
    draft.calculatedPerNamespace = {
      ...draft.calculatedPerNamespace,
      ...calculateNetworks(draft),
    };
    return draft;
  },
  [SET_AVAILABLE_SOURCE_NETWORKS](
    draft,
    {
      payload: { availableSourceNetworks },
    }: PageAction<CreateVmMigration, PlanAvailableSourceNetworks>,
  ) {
    draft.existingResources.sourceNetworks = availableSourceNetworks;
    draft.calculatedPerNamespace = {
      ...draft.calculatedPerNamespace,
      ...calculateNetworks(draft),
    };
    return draft;
  },
};

export const reducer = (
  draft: Draft<CreateVmMigrationPageState>,
  action: PageAction<CreateVmMigration, unknown>,
) => {
  return actions?.[action?.type]?.(draft, action) ?? draft;
};
