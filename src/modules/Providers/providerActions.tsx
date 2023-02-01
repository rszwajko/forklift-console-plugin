import React, { useMemo, useState } from 'react';
import { withActionContext } from 'src/components/ActionServiceDropdown';
import withQueryClient from 'src/components/QueryClientHoc';
import { useTranslation } from 'src/utils/i18n';

import { ConfirmModal } from '@app/common/components/ConfirmModal';
import { SelectOpenShiftNetworkModal } from '@app/common/components/SelectOpenShiftNetworkModal';
import { ProviderType } from '@app/common/constants';
import { AddEditProviderModal } from '@app/Providers/components/AddEditProviderModal';
import { hasRunningMigration } from '@app/Providers/components/ProvidersTable';
import {
  useDeleteProviderMutation,
  useOCPMigrationNetworkMutation,
  usePlansQuery,
} from '@app/queries';
import { IOpenShiftProvider } from '@app/queries/types';
import { useModal } from '@shim/dynamic-plugin-sdk';

import { type MergedProvider } from './data';

export const useMergedProviderActions = ({ entity }: { entity: MergedProvider }) => {
  const { t } = useTranslation();
  const launchModal = useModal();
  const plansQuery = usePlansQuery(entity.namespace);
  const isHostProvider = entity.type === 'openshift' && !entity.url;
  const editingDisabled =
    isHostProvider ||
    hasRunningMigration({
      plans: plansQuery?.data?.items,
      providerMetadata: {
        name: entity.name,
        namespace: entity.namespace,
      },
    });
  const disabledTooltip = isHostProvider
    ? t('The host provider cannot be edited')
    : t('This provider cannot be edited because it has running migrations');

  const actions = useMemo(
    () =>
      [
        {
          id: 'edit',
          cta: () => launchModal(withQueryClient(EditModal), { entity }),
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
    [t, editingDisabled, disabledTooltip, entity],
  );

  return [actions, true, undefined];
};

const EditModal = ({ entity, closeModal }: { closeModal: () => void; entity: MergedProvider }) => {
  return (
    <AddEditProviderModal
      onClose={closeModal}
      providerBeingEdited={entity.object}
      namespace={entity.namespace}
    />
  );
};
EditModal.displayName = 'EditModal';

const SelectNetworkForOpenshift = ({
  entity,
  closeModal,
}: {
  closeModal: () => void;
  entity: MergedProvider;
}) => {
  const { t } = useTranslation();
  const migrationNetworkMutation = useOCPMigrationNetworkMutation(entity.namespace, closeModal);
  const inventory = toIOpenShiftProvider(entity, entity.object);
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
SelectNetworkForOpenshift.displayName = 'SelectNetworkForOpenshift';

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
    entity.namespace,
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
      mutateFn={() => deleteProviderMutation.mutate(entity.object)}
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
DeleteModal.displayName = 'DeleteModal';

export const ProviderActions = withActionContext<MergedProvider>(
  'kebab',
  'forklift-merged-provider',
);
ProviderActions.displayName = 'ProviderActions';

const toIOpenShiftProvider = (
  { name, namespace, networkCount, selfLink, type, uid, vmCount },
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
