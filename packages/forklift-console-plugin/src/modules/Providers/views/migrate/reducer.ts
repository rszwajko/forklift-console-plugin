import { FC } from 'react';
import { Draft } from 'immer';
import { isProviderLocalTarget } from 'src/utils/resources';
import { v4 as randomId } from 'uuid';

import { DefaultRow, ResourceFieldFactory, RowProps, withTr } from '@kubev2v/common';
import { ProviderType, V1beta1Plan, V1beta1Provider } from '@kubev2v/types';

import { validateK8sName, Validation } from '../../utils';
import { planTemplate } from '../create/templates';
import { toId, VmData } from '../details';
import { openShiftVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OpenShiftVirtualMachinesList';
import { openStackVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OpenStackVirtualMachinesList';
import { ovaVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OvaVirtualMachinesList';
import { oVirtVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/OVirtVirtualMachinesList';
import { OVirtVirtualMachinesCells } from '../details/tabs/VirtualMachines/OVirtVirtualMachinesRow';
import { vSphereVmFieldsMetadataFactory } from '../details/tabs/VirtualMachines/VSphereVirtualMachinesList';

import {
  CreateVmMigration,
  PageAction,
  PlanAvailableProviders,
  PlanDescription,
  PlanExistingPlans,
  PlanName,
  PlanTargetNamespace,
  PlanTargetProvider,
  SET_AVAILABLE_PROVIDERS,
  SET_DESCRIPTION,
  SET_EXISTING_PLANS,
  SET_NAME,
  SET_TARGET_NAMESPACE,
  SET_TARGET_PROVIDER,
} from './actions';

export interface CreateVmMigrationPageState {
  newPlan: V1beta1Plan;
  validationError: Error | null;
  apiError: Error | null;
  validation: {
    name: Validation;
    targetNamespace: Validation;
  };
  availableProviders: V1beta1Provider[];
  selectedVms: VmData[];
  existingPlans: V1beta1Plan[];
  vmFieldsFactory: [ResourceFieldFactory, FC<RowProps<unknown>>];
}

const validateUniqueName = (name: string, existingPlanNames: string[]) =>
  existingPlanNames.every((existingName) => existingName !== name);

const actions: {
  [name: string]: (
    draft: Draft<CreateVmMigrationPageState>,
    action: PageAction<CreateVmMigration, unknown>,
  ) => CreateVmMigrationPageState;
} = {
  [SET_NAME](draft, { payload: { name } }: PageAction<CreateVmMigration, PlanName>) {
    draft.newPlan.metadata.name = name;
    draft.validation.name =
      validateK8sName(name) &&
      validateUniqueName(
        name,
        draft.existingPlans.map((plan) => plan?.metadata?.name ?? ''),
      )
        ? 'success'
        : 'error';
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
    draft.validation.targetNamespace = validateK8sName(targetNamespace) ? 'success' : 'error';
    return draft;
  },
  [SET_TARGET_PROVIDER](
    draft,
    { payload: { targetProvider } }: PageAction<CreateVmMigration, PlanTargetProvider>,
  ) {
    draft.newPlan.spec.provider.destination = getObjectRef(targetProvider);
    draft.newPlan.spec.targetNamespace = undefined;
    draft.validation.targetNamespace = 'default';
    return draft;
  },
  [SET_AVAILABLE_PROVIDERS](
    draft,
    { payload: { availableProviders } }: PageAction<CreateVmMigration, PlanAvailableProviders>,
  ) {
    if (!availableProviders?.length) {
      draft.availableProviders = [];
      return draft;
    }

    draft.availableProviders = availableProviders;
    const targetProvider = draft.newPlan.spec.provider.destination;
    // set the default provider if none is set
    // reset the provider if provider was removed
    if (
      !targetProvider ||
      !availableProviders.find((p) => p?.metadata?.name === targetProvider.name)
    ) {
      const firstHostProvider = availableProviders.find((p) => isProviderLocalTarget(p));
      // there might be no host (or other openshift) provider in the namespace
      draft.newPlan.spec.provider.destination = firstHostProvider
        ? getObjectRef(firstHostProvider)
        : undefined;
      draft.newPlan.spec.targetNamespace = undefined;
      draft.validation.targetNamespace = 'default';
    }
    return draft;
  },
  [SET_EXISTING_PLANS](
    draft,
    { payload: { existingPlans } }: PageAction<CreateVmMigration, PlanExistingPlans>,
  ) {
    draft.existingPlans = existingPlans;
    return draft;
  },
};

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
      name: sourceProvider?.metadata?.name
        ? `${sourceProvider?.metadata?.name}-${randomId().substring(0, 8)}`
        : undefined,
      namespace: namespace || process?.env?.DEFAULT_NAMESPACE || 'default',
    },
    spec: {
      ...planTemplate?.spec,
      provider: {
        source: getObjectRef(sourceProvider),
        destination: undefined,
      },
      targetNamespace: namespace,
      vms: selectedVms.map((data) => ({ name: data.name, id: toId(data) })),
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
  },
  vmFieldsFactory: resourceFieldsForType(sourceProvider?.spec?.type as ProviderType),
});

export const resourceFieldsForType = (
  type: ProviderType,
): [ResourceFieldFactory, FC<RowProps<unknown>>] => {
  switch (type) {
    case 'openshift':
      return [openShiftVmFieldsMetadataFactory, DefaultRow];
    case 'openstack':
      return [openStackVmFieldsMetadataFactory, DefaultRow];
    case 'ova':
      return [ovaVmFieldsMetadataFactory, DefaultRow];
    case 'ovirt':
      return [oVirtVmFieldsMetadataFactory, withTr(OVirtVirtualMachinesCells)];
    case 'vsphere':
      return [vSphereVmFieldsMetadataFactory, DefaultRow];
    default:
      return [() => [], DefaultRow];
  }
};
