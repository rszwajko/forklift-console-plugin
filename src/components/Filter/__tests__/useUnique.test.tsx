import { cleanup, renderHook } from '@testing-library/react-hooks';

import { useUnique } from '../EnumFilter';

afterEach(cleanup);

const testEnumValues = [
  { id: 'True', toLabel: () => 'TrueTranslated' },
  { id: 'AlsoTrue', toLabel: () => 'TrueTranslated' },
  { id: 'False', toLabel: () => 'FalseTranslated' },
];

describe('aggregate filters with the same labels', () => {
  it('selects an aggregated filter(no other filters selected)', () => {
    const onSelectedEnumIdsChange = jest.fn();
    const {
      result: {
        current: { filterNames, onFilterUpdate, selectedFilters },
      },
    } = renderHook(() =>
      useUnique({
        supportedEnumValues: testEnumValues,
        onSelectedEnumIdsChange,
        selectedEnumIds: [],
      }),
    );
    expect(filterNames).toStrictEqual(['FalseTranslated', 'TrueTranslated']);
    expect(selectedFilters).toStrictEqual([]);
    onFilterUpdate(['TrueTranslated']);
    expect(onSelectedEnumIdsChange).toBeCalledWith(['True', 'AlsoTrue']);
  });

  it('selects a standard filter(one filter already selected)', () => {
    const onSelectedEnumIdsChange = jest.fn();
    const {
      result: {
        current: { filterNames, onFilterUpdate, selectedFilters },
      },
    } = renderHook(() =>
      useUnique({
        supportedEnumValues: testEnumValues,
        onSelectedEnumIdsChange,
        selectedEnumIds: ['True', 'AlsoTrue'],
      }),
    );
    expect(filterNames).toStrictEqual(['FalseTranslated', 'TrueTranslated']);
    expect(selectedFilters).toStrictEqual(['TrueTranslated']);
    onFilterUpdate(['TrueTranslated', 'FalseTranslated']);
    expect(onSelectedEnumIdsChange).toBeCalledWith([
      'True',
      'AlsoTrue',
      'False',
    ]);
  });
});
