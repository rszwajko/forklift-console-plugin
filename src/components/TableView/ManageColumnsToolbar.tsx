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

import { Field } from '../types';

export const ManageColumnsToolbar = ({
  columns,
  setColumns,
  defaultColumns,
}: {
  columns: Field[];
  defaultColumns: Field[];
  setColumns(columns: Field[]): void;
}) => {
  const { t } = useTranslation();
  const [manageColumns, setManageColumns] = useState(false);
  return (
    <ToolbarItem>
      <Tooltip content={t('Manage Columns')}>
        <Button
          variant="plain"
          onClick={() => setManageColumns(true)}
          aria-label={t('Manage Columns')}
        >
          <ColumnsIcon />
        </Button>
      </Tooltip>
      <ManageColumns
        showModal={manageColumns}
        onClose={() => setManageColumns(false)}
        description={t('Selected columns will be displayed in the table.')}
        columns={columns}
        onChange={setColumns}
        defaultColumns={defaultColumns}
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
      title={t('Manage Columns')}
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
          {t('Save')}
        </Button>,
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>,
        <Button key="restore" variant="link" onClick={restoreDefaults}>
          {t('Restore default colums')}
        </Button>,
      ]}
    >
      <DragDrop onDrop={onDrop}>
        <Droppable hasNoWrapper>
          <DataList
            aria-label={t('Table column management')}
            id="table-column-management"
            isCompact
          >
            {editedColumns.map(({ id, isVisible, isIdentity, toLabel }) => (
              <Draggable key={id} hasNoWrapper>
                <DataListItem
                  aria-labelledby={`draggable-${id}`}
                  ref={React.createRef()}
                >
                  <DataListItemRow>
                    <DataListControl>
                      <DataListDragButton
                        aria-label={t('Reorder')}
                        aria-labelledby={`draggable-${id}`}
                      />
                      <DataListCheck
                        aria-labelledby={`draggable-${id}`}
                        name={id}
                        checked={isVisible}
                        isDisabled={isIdentity}
                        onChange={(value) => onSelect(id, value)}
                        otherControls
                      />
                    </DataListControl>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key={id}>
                          <span id={`draggable-${id}`}>{toLabel(t)}</span>
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
