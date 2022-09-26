import React, { useState } from 'react';
import { RowProps } from 'src/components/TableView';
import { useTranslation } from 'src/internal/i18n';
import { NAME, NAMESPACE, READY, TYPE, URL } from 'src/utils/constants';

import { ConfirmModal } from '@app/common/components/ConfirmModal';
import { ProviderType } from '@app/common/constants';
import { useDeleteProviderMutation } from '@app/queries';
import { StatusIcon } from '@migtools/lib-ui';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Popover,
} from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';

import { MergedProvider } from './data';

interface CellProps {
  value: string;
  entity: MergedProvider;
}
const StatusCell = ({ value, entity: { conditions } }: CellProps) => {
  const { t } = useTranslation();
  const existingConditions = Object.values(conditions).filter(Boolean);
  const toState = (value) =>
    value === 'True' ? 'Ok' : value === 'False' ? 'Error' : 'Unknown';
  return (
    <Popover
      hasAutoWidth
      bodyContent={
        <div>
          {existingConditions.length > 0
            ? existingConditions.map(({ message, status }) => {
                return (
                  <StatusIcon
                    key={message}
                    status={toState(status)}
                    label={message}
                  />
                );
              })
            : 'No information'}
        </div>
      }
    >
      <Button variant="link" isInline aria-label={t(value)}>
        <StatusIcon status={toState(value)} label={t(value)} />
      </Button>
    </Popover>
  );
};

const TextCell = ({ value }: { value: string }) => <>{value}</>;

const ProviderLink = ({ value, entity }: CellProps) => (
  <ResourceLink kind={entity.kind} name={value} namespace={entity?.namespace} />
);

const cellCreator = {
  [NAME]: ProviderLink,
  [READY]: StatusCell,
  [URL]: TextCell,
  [TYPE]: TextCell,
  [NAMESPACE]: ({ value }: CellProps) => (
    <ResourceLink kind="Namespace" name={value} />
  ),
};

const ProviderRow = ({ columns, entity }: RowProps<MergedProvider>) => {
  const { t } = useTranslation();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  console.warn('Modal open?', isDeleteModalOpen, entity);
  const toggleDeleteModal = () => setIsDeleteModalOpen(!isDeleteModalOpen);
  const deleteProviderMutation = useDeleteProviderMutation(
    entity.type as ProviderType,
    toggleDeleteModal,
  );
  const editProvider = () => '';
  const selectNetwork = () => '';
  const isTarget = (type: ProviderType) => type !== 'openshift';
  return (
    <Tr>
      {columns.map(({ id }) => (
        <Td key={id} dataLabel="foo">
          {cellCreator?.[id]?.({
            value: entity[id],
            entity,
          }) ?? <TextCell value={String(entity[id] ?? '')} />}
        </Td>
      ))}
      <Td modifier="fitContent">
        <Dropdown
          position="right"
          onSelect={() => setIsActionMenuOpen(!isActionMenuOpen)}
          toggle={<KebabToggle onToggle={setIsActionMenuOpen} />}
          isOpen={isActionMenuOpen}
          isPlain
          dropdownItems={[
            <DropdownItem key="edit" onClick={editProvider}>
              {t('EditProvider')}
            </DropdownItem>,
            <DropdownItem key="delete" onClick={toggleDeleteModal}>
              {t('DeleteProvider')}
            </DropdownItem>,
            <DropdownItem key="selectNetwork" onClick={selectNetwork}>
              {t('SelectMigrationNetwork')}
            </DropdownItem>,
          ]}
        />
        <ConfirmModal
          titleIconVariant="warning"
          confirmButtonVariant="danger"
          position="top"
          isOpen={isDeleteModalOpen}
          toggleOpen={toggleDeleteModal}
          mutateFn={() =>
            deleteProviderMutation.mutate({
              metadata: {
                name: entity.name,
                namespace: entity.namespace,
              },
              spec: { type: entity.type as ProviderType },
              kind: '',
              apiVersion: '',
            })
          }
          mutateResult={deleteProviderMutation}
          title={t('PermanentlyDeleteProvider')}
          body={t(
            isTarget(entity.type as ProviderType)
              ? 'ProviderNoLongerSelectableAsTarget'
              : 'ProviderNoLongerSelectableAsSource',
            { type: entity.type, name: entity.name },
          )}
          confirmButtonText={t('Delete')}
          errorText={t('CannotDeleteProvider')}
          cancelButtonText={t('Cancel')}
        />
      </Td>
    </Tr>
  );
};

export default ProviderRow;
