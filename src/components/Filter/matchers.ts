import { Field } from '../types';

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
  (entity): boolean =>
    fields
      .filter(({ filter }) => filter?.type === filterType)
      .filter(({ id }) => selectedFilters[id] && selectedFilters[id]?.length)
      .map(({ id }) => ({
        value: entity?.[id],
        filters: selectedFilters[id],
      }))
      .map(({ value, filters }) => filters.some(matchValue(value)))
      .every(Boolean);

export const freetextMatcher = {
  filterType: 'freetext',
  matchValue: (value: string) => (filter: string) => value?.includes(filter),
};

const defaultValueMatchers = [
  freetextMatcher,
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
  (entity): boolean =>
    valueMatchers
      .map(({ filterType, matchValue }) =>
        createMatcher({ selectedFilters, filterType, matchValue, fields }),
      )
      .map((match) => match(entity))
      .every(Boolean);
