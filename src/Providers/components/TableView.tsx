import React, { useState } from 'react';
import { useTranslation } from 'src/internal/i18n';

import { TableComposable, Tbody, Th, Thead, Tr } from '@patternfly/react-table';

import { NAME } from './shared';
import { buildSort, Field, localeCompare, SortType } from './shared';

function compareWith<T>(
  sortType: SortType,
  locale: string,
  toValue: (resource: T) => string,
): (a: T, b: T) => number {
  return (a, b) => {
    const aValue: string = toValue?.(a) + '' ?? '';
    const bValue: string = toValue?.(b) + '' ?? '';
    const compareValue = localeCompare(aValue, bValue, locale);
    return sortType.isAsc ? compareValue : -compareValue;
  };
}

const find = (fields: Field[], id: string): Field =>
  fields.find((field) => field.id === id);

function TableView<T>({
  fields,
  resources,
  'aria-label': ariaLabel,
  nameColumnId = NAME,
  Row,
}: TableViewProps<T>) {
  const { t, i18n } = useTranslation();
  // sort state is local (no sorting in toolbar)
  const [activeSort, setActiveSort] = useState<SortType>({
    isAsc: false,
    id: nameColumnId,
    tKey: find(fields, nameColumnId)?.tKey ?? nameColumnId,
  });

  // in future handle column re-ordering and hiding
  const columns = fields;

  resources.sort(
    compareWith(
      activeSort,
      i18n.resolvedLanguage,
      find(fields, activeSort.id)?.toValue,
    ),
  );

  return (
    <TableComposable
      aria-label={ariaLabel}
      variant="compact"
      // isStriped
      isStickyHeader
    >
      <Thead>
        <Tr>
          {columns.map(({ id, tKey, sortable }, columnIndex) => (
            <Th
              key={id}
              sort={
                sortable &&
                buildSort({
                  activeSort,
                  columnIndex,
                  columns,
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
        {resources.map((resource, index) => (
          <Row
            key={find(fields, nameColumnId)?.toValue(resource) ?? index}
            resource={resource}
            columns={columns}
          />
        ))}
      </Tbody>
    </TableComposable>
  );
}

export interface RowProps<T> {
  columns: Field[];
  resource: T;
}

interface TableViewProps<T> {
  fields: Field[];
  resources: T[];
  'aria-label': string;
  nameColumnId?: string;
  Row(props: RowProps<T>): JSX.Element;
}

export default TableView;
