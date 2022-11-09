import React, { useMemo, useState } from 'react';
import { createActions } from 'src/extensions/actions';
import withQueryClient from 'src/extensions/QueryClientHoc';
import { useTranslation } from 'src/internal/i18n';

import { ConfirmModal } from '@app/common/components/ConfirmModal';
import { SelectOpenShiftNetworkModal } from '@app/common/components/SelectOpenShiftNetworkModal';
import { ProviderType } from '@app/common/constants';
import { AddEditProviderModal } from '@app/Providers/components/AddEditProviderModal';
import { hasRunningMigration } from '@app/Providers/components/ProvidersTable/ProviderActionsDropdown';
import { EditProviderContext } from '@app/Providers/ProvidersPage';
import {
  useDeleteProviderMutation,
  useOCPMigrationNetworkMutation,
  usePlansQuery,
} from '@app/queries';
import { IOpenShiftProvider, IPlan, IProviderObject } from '@app/queries/types';
import { ActionServiceProvider, useModal } from '@openshift-console/dynamic-plugin-sdk';

import { MergedProvider } from './data';

export const useMergedProviderActions = (entity: MergedProvider) => {
  const { t } = useTranslation();
  const launchModal = useModal();
  const plansQuery = usePlansQuery();
  const editingDisabled =
    !entity.url ||
    hasRunningMigration({
      plans: plansQuery?.data?.items,
      providerMetadata: {
        name: entity.name,
        namespace: entity.namespace,
      },
    });
  const disabledTooltip = !entity.url
    ? t('The host provider cannot be edited')
    : t('This provider cannot be edited because it has running migrations');

  const actions = useMemo(
    () =>
      [
        {
          id: 'edit',
          cta: () =>
            launchModal(withQueryClient(EditModal), {
              entity,
              plans: plansQuery?.data?.items,
            }),
          label: t('Edit Provider'),
          disabled: editingDisabled,
          disabledTooltip: editingDisabled ? disabledTooltip : '',
        },
        {
          id: 'delete',
          cta: () => launchModal(withQueryClient(DeleteModal), { entity }),
          label: t('Delete Provider'),
          disabled: editingDisabled,
          disabledTooltip: editingDisabled ? disabledTooltip : '',
        },
        entity.type === 'openshift' && {
          id: 'selectNetwork',
          cta: () => launchModal(withQueryClient(SelectNetworkForOpenshift), { entity }),
          label: t('Select migration network'),
        },
      ].filter(Boolean),
    [t, editingDisabled, disabledTooltip],
  );

  return [actions, true, undefined];
};

const EditModal = ({
  entity,
  closeModal,
  plans = [],
}: {
  closeModal: () => void;
  entity: MergedProvider;
  plans: IPlan[];
}) => {
  return (
    <EditProviderContext.Provider value={{ openEditProviderModal: () => undefined, plans }}>
      <AddEditProviderModal onClose={closeModal} providerBeingEdited={toIProviderObject(entity)} />
    </EditProviderContext.Provider>
  );
};

const SelectNetworkForOpenshift = ({
  entity,
  closeModal,
}: {
  closeModal: () => void;
  entity: MergedProvider;
}) => {
  const { t } = useTranslation();
  const migrationNetworkMutation = useOCPMigrationNetworkMutation(closeModal);
  const inventory = toIOpenShiftProvider(entity, toIProviderObject(entity));
  return (
    <SelectOpenShiftNetworkModal
      targetProvider={inventory}
      targetNamespace={null}
      initialSelectedNetwork={entity.defaultTransferNetwork}
      instructions={t(
        'Select a default migration network for the provider. This network will be used for migrating data to all namespaces to which it is attached.',
      )}
      onClose={() => {
        migrationNetworkMutation.reset();
        closeModal();
      }}
      onSubmit={(network) =>
        migrationNetworkMutation.mutate({
          provider: inventory,
          network,
        })
      }
      mutationResult={migrationNetworkMutation}
    />
  );
};

const DeleteModal = ({
  entity,
  closeModal,
}: {
  closeModal: () => void;
  entity: MergedProvider;
}) => {
  const { t } = useTranslation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(true);

  const toggleDeleteModal = () => setIsDeleteModalOpen(!isDeleteModalOpen);
  const deleteProviderMutation = useDeleteProviderMutation(
    entity.type as ProviderType,
    toggleDeleteModal,
  );
  const isTarget = (type: ProviderType) => type !== 'openshift';

  return (
    <ConfirmModal
      titleIconVariant="warning"
      confirmButtonVariant="danger"
      position="top"
      isOpen={true}
      toggleOpen={() => {
        toggleDeleteModal();
        closeModal();
      }}
      mutateFn={() => deleteProviderMutation.mutate(toIProviderObject(entity))}
      mutateResult={deleteProviderMutation}
      title={t('Permanently delete provider?')}
      body={
        isTarget(entity.type as ProviderType)
          ? t('{{type}} provider {{name}} will no longer be selectable as a migration target.', {
              type: entity.type,
              name: entity.name,
            })
          : t('{{type}} provider {{name}} will no longer be selectable as a migration source.', {
              type: entity.type,
              name: entity.name,
            })
      }
      confirmButtonText={t('Delete')}
      errorText={t('Cannot remove provider')}
      cancelButtonText={t('Cancel')}
    />
  );
};
export interface ProviderActionsProps {
  entity: MergedProvider;
  variant?: 'kebab' | 'dropdown';
}

export const ProviderActions = ({ entity, variant = 'kebab' }: ProviderActionsProps) => {
  const ActionsComponent = useMemo(() => createActions(variant), [variant]);
  return (
    <ActionServiceProvider context={{ mergedProvider: entity }}>
      {ActionsComponent}
    </ActionServiceProvider>
  );
};

const toIProviderObject = ({
  name,
  namespace,
  type,
  url,
  secretName,
  kind,
  apiVersion,
}: MergedProvider): IProviderObject => ({
  metadata: {
    name,
    namespace,
  },
  spec: { type: type as ProviderType, url, secret: { name: secretName, namespace } },
  kind,
  apiVersion,
});

const toIOpenShiftProvider = (
  { name, namespace, networkCount, selfLink = 'foo', type, uid, vmCount },
  object,
): IOpenShiftProvider => ({
  object,
  name,
  namespace,
  networkCount,
  selfLink,
  type,
  uid,
  vmCount,
});
