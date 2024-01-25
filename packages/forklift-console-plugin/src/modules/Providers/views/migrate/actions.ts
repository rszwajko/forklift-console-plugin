import { OpenShiftNamespace, V1beta1Plan, V1beta1Provider } from '@kubev2v/types';
import { V1beta1NetworkMapSpecMapSource } from '@kubev2v/types/dist/models/V1beta1NetworkMapSpecMapSource';

import { Mapping } from './MappingList';

export const POD_NETWORK = 'Pod Networking';
export const DEFAULT_NAMESPACE = 'default';

// action type names
export const SET_NAME = 'SET_NAME';
export const SET_DESCRIPTION = 'SET_DESCRIPTION';
export const SET_TARGET_PROVIDER = 'SET_TARGET_PROVIDER';
export const SET_TARGET_NAMESPACE = 'SET_TARGET_NAMESPACE';
export const SET_AVAILABLE_PROVIDERS = 'SET_AVAILABLE_PROVIDERS';
export const SET_EXISTING_PLANS = 'SET_EXISTING_PLANS';
export const SET_AVAILABLE_TARGET_NAMESPACES = 'SET_AVAILABLE_TARGET_NAMESPACES';
export const REPLACE_NETWORK_MAPPING = 'REPLACE_NETWORK_MAPPING';
export const REPLACE_STORAGE_MAPPING = 'REPLACE_STORAGE_MAPPING';
export const SET_AVAILABLE_TARGET_NETWORKS = 'SET_AVAILABLE_TARGET_NETWORKS';
export const SET_AVAILABLE_SOURCE_NETWORKS = 'SET_AVAILABLE_SOURCE_NETWORKS';

export type CreateVmMigration =
  | typeof SET_NAME
  | typeof SET_DESCRIPTION
  | typeof SET_TARGET_PROVIDER
  | typeof SET_TARGET_NAMESPACE
  | typeof SET_AVAILABLE_PROVIDERS
  | typeof SET_EXISTING_PLANS
  | typeof SET_AVAILABLE_TARGET_NAMESPACES
  | typeof REPLACE_NETWORK_MAPPING
  | typeof REPLACE_STORAGE_MAPPING
  | typeof SET_AVAILABLE_TARGET_NETWORKS
  | typeof SET_AVAILABLE_SOURCE_NETWORKS;

export interface PageAction<S, T> {
  type: S;
  payload: T;
}

// action payload types

export interface PlanName {
  name: string;
}

export interface PlanDescription {
  description: string;
}

export interface PlanTargetProvider {
  targetProviderName: string;
}

export interface PlanTargetNamespace {
  targetNamespace: string;
}

export interface PlanAvailableProviders {
  availableProviders: V1beta1Provider[];
}

export interface PlanExistingPlans {
  existingPlans: V1beta1Plan[];
}

export interface PlanAvailableTargetNamespaces {
  availableTargetNamespaces: OpenShiftNamespace[];
}

export interface PlanAvailableTargetNetworks {
  availableTargetNetworks: V1beta1NetworkMapSpecMapSource[];
}

export interface PlanAvailableSourceNetworks {
  availableSourceNetworks: V1beta1NetworkMapSpecMapSource[];
}

export interface PlanMapping {
  current?: Mapping;
  next?: Mapping;
}

// action creators

export const setPlanTargetProvider = (
  targetProviderName: string,
): PageAction<CreateVmMigration, PlanTargetProvider> => ({
  type: 'SET_TARGET_PROVIDER',
  payload: { targetProviderName },
});

export const setPlanTargetNamespace = (
  targetNamespace: string,
): PageAction<CreateVmMigration, PlanTargetNamespace> => ({
  type: 'SET_TARGET_NAMESPACE',
  payload: { targetNamespace },
});

export const setPlanDescription = (
  description: string,
): PageAction<CreateVmMigration, PlanDescription> => ({
  type: 'SET_DESCRIPTION',
  payload: { description },
});

export const setPlanName = (name: string): PageAction<CreateVmMigration, PlanName> => ({
  type: 'SET_NAME',
  payload: {
    name,
  },
});

export const setAvailableProviders = (
  availableProviders: V1beta1Provider[],
): PageAction<CreateVmMigration, PlanAvailableProviders> => ({
  type: 'SET_AVAILABLE_PROVIDERS',
  payload: {
    availableProviders,
  },
});

export const setExistingPlans = (
  existingPlans: V1beta1Plan[],
): PageAction<CreateVmMigration, PlanExistingPlans> => ({
  type: 'SET_EXISTING_PLANS',
  payload: {
    existingPlans,
  },
});

export const setAvailableTargetNamespaces = (
  availableTargetNamespaces: OpenShiftNamespace[],
): PageAction<CreateVmMigration, PlanAvailableTargetNamespaces> => ({
  type: 'SET_AVAILABLE_TARGET_NAMESPACES',
  payload: { availableTargetNamespaces },
});

export const replaceStorageMapping = ({
  current,
  next,
}: PlanMapping): PageAction<CreateVmMigration, PlanMapping> => ({
  type: 'REPLACE_STORAGE_MAPPING',
  payload: { current, next },
});

export const replaceNetworkMapping = ({
  current,
  next,
}: PlanMapping): PageAction<CreateVmMigration, PlanMapping> => ({
  type: 'REPLACE_NETWORK_MAPPING',
  payload: { current, next },
});

export const setAvailableTargetNetworks = (
  availableTargetNetworks: V1beta1NetworkMapSpecMapSource[],
): PageAction<CreateVmMigration, PlanAvailableTargetNetworks> => ({
  type: 'SET_AVAILABLE_TARGET_NETWORKS',
  payload: { availableTargetNetworks },
});

export const setAvailableSourceNetworks = (
  availableSourceNetworks: V1beta1NetworkMapSpecMapSource[],
): PageAction<CreateVmMigration, PlanAvailableSourceNetworks> => ({
  type: 'SET_AVAILABLE_SOURCE_NETWORKS',
  payload: { availableSourceNetworks },
});
