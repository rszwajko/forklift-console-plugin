import React from 'react';
import { useTranslation } from 'src/internal/i18n';
import { UID } from 'src/utils/constants';

import { TableComposable, Tbody, Th, Thead, Tr } from '@patternfly/react-table';

import { Field } from '../types';

import { buildSort, useSort } from './sort';
import { RowProps } from './types';

export function TableView<T>({
  uidFieldId = UID,
  allColumns,
  visibleColumns,
  entities,
  'aria-label': ariaLabel,
  Row,
}: TableViewProps<T>) {
  const { t } = useTranslation();

  const [activeSort, setActiveSort, comparator] = useSort(allColumns);

  entities.sort(comparator);

  return (
    <TableComposable aria-label={ariaLabel} variant="compact" isStickyHeader>
      <Thead>
        <Tr>
          {visibleColumns.map(({ id, tKey, sortable }, columnIndex) => (
            <Th
              key={id}
              sort={
                sortable &&
                buildSort({
                  activeSort,
                  columnIndex,
                  columns: visibleColumns,
                  setActiveSort,
                })
              }
            >
              {t(tKey)}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {entities.map((entity, index) => (
          <Row
            key={entity?.[uidFieldId] ?? index}
            entity={entity}
            columns={visibleColumns}
          />
        ))}
      </Tbody>
    </TableComposable>
  );
}

interface TableViewProps<T> {
  allColumns: Field[];
  visibleColumns: Field[];
  entities: T[];
  'aria-label': string;
  uidFieldId?: string;
  Row(props: RowProps<T>): JSX.Element;
}
