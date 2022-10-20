import { useState } from 'react';
import { useTranslation } from 'src/internal/i18n';
import { localeCompare } from 'src/utils/helpers';

import { ThSortType } from '@patternfly/react-table/dist/esm/components/Table/base';

import { Field, SortType } from '../types';

import { Column } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const universalComparator = (a: any, b: any, locale: string) =>
  localeCompare(String(a ?? ''), String(b ?? ''), locale);

export function compareWith<T>(
  sortType: SortType,
  locale: string,
  fieldComparator: (a: T, b: T, locale: string) => number,
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const comparator = fieldComparator ?? universalComparator;
    const compareValue = comparator(a[sortType.id], b[sortType.id], locale);
    return sortType.isAsc ? compareValue : -compareValue;
  };
}

export const useSort = (
  fields: Field[],
): [SortType, (sort: SortType) => void, (a, b) => number] => {
  const { i18n } = useTranslation();

  // by default sort by the first identity column (if any)
  const [firstField] = [...fields].sort(
    (a, b) => Number(Boolean(b.isIdentity)) - Number(Boolean(a.isIdentity)),
  );

  const [activeSort, setActiveSort] = useState<SortType>({
    isAsc: false,
    id: firstField?.id,
    tKey: firstField?.tKey,
  });

  const comparator = compareWith(
    activeSort,
    i18n.resolvedLanguage,
    fields.find((field) => field.id === activeSort.id)?.comparator,
  );

  return [activeSort, setActiveSort, comparator];
};

export const buildSort = ({
  columnIndex,
  columns,
  activeSort,
  setActiveSort,
}: {
  columnIndex: number;
  columns: Column[];
  activeSort: SortType;
  setActiveSort: (sort: SortType) => void;
}): ThSortType => ({
  sortBy: {
    index: columns.findIndex(({ id }) => id === activeSort.id),
    direction: activeSort.isAsc ? 'asc' : 'desc',
  },
  onSort: (_event, index, direction) => {
    columns[index]?.id &&
      setActiveSort({
        isAsc: direction === 'asc',
        ...columns[index],
      });
  },
  columnIndex,
});
