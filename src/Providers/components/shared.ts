import { ProviderResource } from 'src/internal/k8s';

import { ThSortType } from '@patternfly/react-table/dist/esm/components/Table/base';

export const localeCompare = (a: string, b: string, locale: string): number =>
  a.localeCompare(b, locale, { numeric: true });

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

export const createMatcher =
  ({
    selectedFilters,
    filterType,
    matchValue,
    fields,
  }: {
    selectedFilters: { [id: string]: string[] };
    filterType: string;
    matchValue: (value: string) => (filterValue: string) => boolean;
    fields: Field[];
  }) =>
  (provider: ProviderResource): boolean =>
    fields
      .filter(({ filter: { type } }) => type === filterType)
      .filter(({ id }) => selectedFilters[id] && selectedFilters[id]?.length)
      .map(({ id, toValue }) => ({
        value: toValue(provider),
        filters: selectedFilters[id],
      }))
      .map(({ value, filters }) => filters.some(matchValue(value)))
      .every(Boolean);

const defaultValueMatchers = [
  {
    filterType: 'freetext',
    matchValue: (value: string) => (filter: string) => value?.includes(filter),
  },
  {
    filterType: 'enum',
    matchValue: (value: string) => (filter: string) => value === filter,
  },
];

export const createMetaMatcher =
  (
    selectedFilters: { [id: string]: string[] },
    fields: Field[],
    valueMatchers: {
      filterType: string;
      matchValue: (value: string) => (filter: string) => boolean;
    }[] = defaultValueMatchers,
  ) =>
  (provider: ProviderResource): boolean =>
    valueMatchers
      .map(({ filterType, matchValue }) =>
        createMatcher({ selectedFilters, filterType, matchValue, fields }),
      )
      .map((match) => match(provider))
      .every(Boolean);

export interface SortType {
  isAsc: boolean;
  id: string;
  tKey: string;
}

export interface FilterDef {
  type: string;
  placeholderKey: string;
  values?: { id: string; tKey: string }[];
  tKey?: string;
  primary?: boolean;
}
export interface Field {
  id: string;
  tKey: string;
  isVisible?: boolean;
  sortable?: boolean;
  filter: FilterDef;
  toValue: (provider: ProviderResource) => string;
}

export interface Column {
  id: string;
  tKey: string;
  sortable?: boolean;
}

export interface SortableTableProps {
  activeSort: SortType;
  ['aria-label']?: string;
  columns: Column[];
  fields: { [key: string]: Field };
  children: React.ReactNode[];
  setActiveSort(sort: SortType): void;
}

export const NAME = 'name';
export const READY = 'ready';
export const TYPE = 'type';
export const URL = 'url';
