import React, { useState } from 'react';
import { useTranslation } from 'src/internal/i18n';

import {
  Button,
  DataList,
  DataListCell,
  DataListCheck,
  DataListControl,
  DataListDragButton,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DragDrop,
  Draggable,
  Droppable,
  Modal,
  Text,
  TextContent,
  TextVariants,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { ColumnsIcon } from '@patternfly/react-icons';

import { Field } from './shared';

export const ManageColumnsToolbar = ({
  fields,
  setFields,
  defaultFields,
}: {
  fields: Field[];
  defaultFields: Field[];
  setFields(fileds: Field[]): void;
}) => {
  const { t } = useTranslation();
  const [manageColumns, setManageColumns] = useState(false);
  return (
    <ToolbarItem>
      <Tooltip content={t('plugin__forklift-console-plugin~ManageColumns')}>
        <Button
          variant="plain"
          onClick={() => setManageColumns(true)}
          aria-label={t('plugin__forklift-console-plugin~ManageColumns')}
        >
          <ColumnsIcon />
        </Button>
      </Tooltip>
      <ManageColumns
        showModal={manageColumns}
        onClose={() => setManageColumns(false)}
        description="Selected columns will be displayed in the table."
        columns={fields}
        onChange={setFields}
        defaultColumns={defaultFields}
      />
    </ToolbarItem>
  );
};

interface ManagedColumnsProps {
  showModal: boolean;
  description: string;
  onClose(): void;
  onChange(colums: Field[]): void;
  columns: Field[];
  defaultColumns: Field[];
}

const ManageColumns = ({
  showModal,
  description,
  onClose,
  onChange,
  columns,
  defaultColumns,
}: ManagedColumnsProps) => {
  const { t } = useTranslation();
  const [editedColumns, setEditedColumns] = useState(columns);
  const restoreDefaults = () => setEditedColumns([...defaultColumns]);
  const onDrop = (source: { index: number }, dest: { index: number }) => {
    const target = editedColumns[source.index];
    const base = editedColumns.filter(({ id }) => id !== target?.id);
    setEditedColumns([
      ...base.slice(0, dest.index),
      target,
      ...base.slice(dest.index, base.length),
    ]);
    return true;
  };
  const onSelect = (updatedId: string, updatedValue: boolean): void => {
    setEditedColumns(
      editedColumns.map(({ id, isVisible, ...rest }) => ({
        id,
        ...rest,
        isVisible: id === updatedId ? updatedValue : isVisible,
      })),
    );
  };
  const onSave = () => {
    onChange(editedColumns);
    onClose();
  };

  return (
    <Modal
      title={t('plugin__forklift-console-plugin~ManageColumns')}
      isOpen={showModal}
      variant="small"
      description={
        <TextContent>
          <Text component={TextVariants.p}>{description}</Text>
        </TextContent>
      }
      onClose={onClose}
      actions={[
        <Button
          key="save"
          variant="primary"
          isDisabled={columns === editedColumns}
          onClick={onSave}
        >
          {t('plugin__forklift-console-plugin~Save')}
        </Button>,
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('plugin__forklift-console-plugin~Cancel')}
        </Button>,
        <Button key="restore" variant="link" onClick={restoreDefaults}>
          {t('plugin__forklift-console-plugin~RestoreDefaultColums')}
        </Button>,
      ]}
    >
      <DragDrop onDrop={onDrop}>
        <Droppable hasNoWrapper>
          <DataList
            aria-label={t(
              'plugin__forklift-console-plugin~TableColumnManagement',
            )}
            id="table-column-management"
            isCompact
          >
            {editedColumns.map(({ id, isVisible, tKey }) => (
              <Draggable key={id} hasNoWrapper>
                <DataListItem
                  aria-labelledby={`draggable-${id}`}
                  ref={React.createRef()}
                >
                  <DataListItemRow>
                    <DataListControl>
                      <DataListDragButton
                        aria-label={t(
                          'plugin__forklift-console-plugin~Reorder',
                        )}
                        aria-labelledby={`draggable-${id}`}
                      />
                      <DataListCheck
                        aria-labelledby={`draggable-${id}`}
                        name={id}
                        checked={isVisible}
                        onChange={(value) => onSelect(id, value)}
                        otherControls
                      />
                    </DataListControl>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key={id}>
                          <span id={`draggable-${id}`}>{t(tKey)}</span>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              </Draggable>
            ))}
          </DataList>
        </Droppable>
      </DragDrop>
    </Modal>
  );
};
