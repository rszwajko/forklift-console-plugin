import { FC } from 'react';
import { Draft } from 'immer';
import { isProviderLocalOpenshift } from 'src/utils/resources';

import { ResourceFieldFactory, RowProps } from '@kubev2v/common';
import {
  OpenShiftNamespace,
  OpenshiftResource,
  OVirtNicProfile,
  V1beta1NetworkMap,
  V1beta1Plan,
  V1beta1Provider,
  V1beta1StorageMap,
} from '@kubev2v/types';

import { InventoryNetwork } from '../../hooks/useNetworks';
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
  PlanNickProfiles,
  PlanTargetNamespace,
  PlanTargetProvider,
  SET_AVAILABLE_PROVIDERS,
  SET_AVAILABLE_SOURCE_NETWORKS,
  SET_AVAILABLE_TARGET_NAMESPACES,
  SET_AVAILABLE_TARGET_NETWORKS,
  SET_EXISTING_PLANS,
  SET_NAME,
  SET_NICK_PROFILES,
  SET_TARGET_NAMESPACE,
  SET_TARGET_PROVIDER,
} from './actions';
import { getNetworksUsedBySelectedVms } from './getNetworksUsedBySelectedVMs';
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
    targetNetworks: OpenshiftResource[];
    sourceNetworks: InventoryNetwork[];
    targetStorages: unknown[];
    nickProfiles: OVirtNicProfile[];
  };
  loaded: {
    nickProfiles: boolean;
  };
  calculatedOnce: {
    // calculated on start (exception:for ovirt/openstack we need to fetch disks)
    storagesUsedBySelectedVms: string[];
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
    targetNetworkLabels: string[];
    targetNetworkLabelToId: { [label: string]: string };
    // mutated, human-readable
    sourceNetworkLabels: string[];
    sourceStorages: string[];
    // both source and destination human-readable
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

let counter = 0;

const actions: {
  [name: string]: (
    draft: Draft<CreateVmMigrationPageState>,
    action: PageAction<CreateVmMigration, unknown>,
  ) => CreateVmMigrationPageState | void;
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
    {
      payload: { availableProviders, loading, error },
    }: PageAction<CreateVmMigration, PlanAvailableProviders>,
  ) {
    if (loading || error) {
      return draft;
    }
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
    {
      payload: { existingPlans, loading, error },
    }: PageAction<CreateVmMigration, PlanExistingPlans>,
  ) {
    if (loading || error) {
      return draft;
    }
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
      payload: { availableTargetNamespaces, loading, error },
    }: PageAction<CreateVmMigration, PlanAvailableTargetNamespaces>,
  ) {
    const {
      existingResources,
      validation,
      underConstruction: { plan },
      workArea: { targetProvider },
    } = draft;
    if (loading || error) {
      return;
    }

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
      payload: { availableTargetNetworks, loading, error },
    }: PageAction<CreateVmMigration, PlanAvailableTargetNetworks>,
  ) {
    if (loading || error) {
      return draft;
    }
    draft.existingResources.targetNetworks = availableTargetNetworks;

    draft.calculatedPerNamespace = {
      ...draft.calculatedPerNamespace,
      ...calculateNetworks(draft),
    };
    return draft;
  },
  [SET_AVAILABLE_SOURCE_NETWORKS](
    draft,
    {
      payload: { availableSourceNetworks, loading, error },
    }: PageAction<CreateVmMigration, PlanAvailableSourceNetworks>,
  ) {
    if (loading || error) {
      return draft;
    }
    draft.existingResources.sourceNetworks = availableSourceNetworks;
    console.warn('source networks', counter++, availableSourceNetworks);
    draft.calculatedOnce.sourceNetworkLabelToId = Object.fromEntries(
      draft.existingResources.sourceNetworks
        .map((net) => {
          switch (net.providerType) {
            case 'openshift': {
              return [`${net.namespace}/${net.name}`, net.uid];
            }
            case 'openstack': {
              return [net.name, net.id];
            }
            case 'ovirt': {
              return [net.path, net.id];
            }
            case 'vsphere': {
              return [net.name, net.id];
            }
            default: {
              return undefined;
            }
          }
        })
        .filter(Boolean),
    );
    draft.calculatedPerNamespace = {
      ...draft.calculatedPerNamespace,
      ...calculateNetworks(draft),
    };
    return draft;
  },
  [SET_NICK_PROFILES](
    draft,
    { payload: { nickProfiles, loading, error } }: PageAction<CreateVmMigration, PlanNickProfiles>,
  ) {
    const {
      existingResources,
      calculatedOnce,
      receivedAsParams: { selectedVms },
    } = draft;
    if (loading || error) {
      return;
    }

    existingResources.nickProfiles = nickProfiles;
    calculatedOnce.networkIdsUsedBySelectedVms = getNetworksUsedBySelectedVms(
      selectedVms,
      nickProfiles,
    );
    draft.calculatedPerNamespace = {
      ...draft.calculatedPerNamespace,
      ...calculateNetworks(draft),
    };
  },
};

export const reducer = (
  draft: Draft<CreateVmMigrationPageState>,
  action: PageAction<CreateVmMigration, unknown>,
) => {
  return actions?.[action?.type]?.(draft, action) ?? draft;
};
