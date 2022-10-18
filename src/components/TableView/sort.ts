import { useMemo, useState } from 'react';
import { useTranslation } from 'src/internal/i18n';
import { localeCompare } from 'src/utils/helpers';

import { ThSortType } from '@patternfly/react-table/dist/esm/components/Table/base';

import { Field, SortType } from '../types';

import { Column } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const universalComparator = (a: any, b: any, locale: string) =>
  localeCompare(String(a ?? ''), String(b ?? ''), locale);

export function compareWith(
  sortType: SortType,
  locale: string,
  fieldComparator: (a, b, locale: string) => number,
): (a, b) => number {
  return (a, b) => {
    if (!sortType.id) {
      return 0;
    }
    const comparator = fieldComparator ?? universalComparator;
    const compareValue = comparator(
      a?.[sortType.id],
      b?.[sortType.id],
      locale ?? 'en',
    );
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
    toLabel: firstField?.toLabel,
  });

  const comparator = useMemo(
    () =>
      compareWith(
        activeSort,
        i18n.resolvedLanguage,
        fields.find((field) => field.id === activeSort.id)?.comparator,
      ),
    [fields],
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
    index:
      columns.find(({ id }) => id === activeSort.id) &&
      columns.findIndex(({ id }) => id === activeSort.id),
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
