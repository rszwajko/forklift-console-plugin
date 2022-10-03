import React, { useState } from 'react';
import { useTranslation } from 'src/internal/i18n';

import {
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import { MetaFilterProps } from './types';

interface IdOption extends SelectOptionObject {
  id: string;
}

const toSelectOption = (id: string, label: string): IdOption => ({
  id,
  compareTo: (other: IdOption): boolean => id === other?.id,
  toString: () => label,
});

export const AttributeValueFilter = ({
  selectedFilters,
  onFilterUpdate,
  filterTypes,
  supportedFilters = {},
}: MetaFilterProps) => {
  const { t } = useTranslation();
  const [currentFilterType, setCurrentFilterType] = useState(filterTypes[0]);
  const [expanded, setExpanded] = useState(false);

  const selectOptionToFilter = (selectedId) =>
    filterTypes.find(({ id }) => id === selectedId) ?? currentFilterType;

  const onFilterTypeSelect = (event, value, isPlaceholder) => {
    if (!isPlaceholder) {
      setCurrentFilterType(selectOptionToFilter(value?.id));
      setExpanded(!expanded);
    }
  };

  return (
    <ToolbarGroup variant="filter-group">
      <ToolbarItem>
        <Select
          onSelect={onFilterTypeSelect}
          onToggle={setExpanded}
          isOpen={expanded}
          variant={SelectVariant.single}
          aria-label={t('Select Filter')}
          selections={toSelectOption(
            currentFilterType.id,
            currentFilterType.toLabel(t),
          )}
        >
          {filterTypes.map(({ id, toLabel }) => (
            <SelectOption key={id} value={toSelectOption(id, toLabel(t))} />
          ))}
        </Select>
      </ToolbarItem>

      {filterTypes.map(({ id, toLabel: toFieldLabel, filter }) => {
        const FieldFilter = supportedFilters[filter.type];
        return (
          FieldFilter && (
            <FieldFilter
              filterId={id}
              onFilterUpdate={(values) =>
                onFilterUpdate({
                  ...selectedFilters,
                  [id]: values,
                })
              }
              placeholderLabel={filter.toPlaceholderLabel(t)}
              selectedFilters={selectedFilters[id] ?? []}
              showFilter={currentFilterType?.id === id}
              title={filter?.toLabel?.(t) ?? toFieldLabel(t)}
              supportedValues={filter.values}
            />
          )
        );
      })}
    </ToolbarGroup>
  );
};
