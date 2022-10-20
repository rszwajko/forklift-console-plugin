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

import { FilterDef } from './shared';

interface IdOption extends SelectOptionObject {
  id: string;
}

const toSelectOption = (id: string, label: string): IdOption => ({
  id,
  compareTo: (other: IdOption): boolean => id === other?.id,
  toString: () => label,
});

const AttributeValueFilter = ({
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
          aria-label={t('SelectFilter')}
          selections={toSelectOption(
            currentFilterType.id,
            t(currentFilterType.tKey),
          )}
        >
          {filterTypes.map(({ id, tKey }) => (
            <SelectOption key={id} value={toSelectOption(id, t(tKey))} />
          ))}
        </Select>
      </ToolbarItem>

      {filterTypes.map(({ id, tKey: fieldKey, filter }) => {
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
              placeholderLabel={t(filter.placeholderKey)}
              selectedFilters={selectedFilters[id] ?? []}
              showFilter={currentFilterType?.id === id}
              title={t(filter.tKey ?? fieldKey)}
              supportedValues={filter.values}
            />
          )
        );
      })}
    </ToolbarGroup>
  );
};

export interface FieldFilterProps {
  filterId: string;
  onFilterUpdate(values: string[]);
  placeholderLabel: string;
  selectedFilters: string[];
  showFilter: boolean;
  title: string;
  supportedValues?: { id: string; tKey?: string }[];
}

export interface MetaFilterProps {
  selectedFilters: { [id: string]: string[] };
  filterTypes: {
    id: string;
    tKey: string;
    filter: FilterDef;
  }[];
  onFilterUpdate(filters: { [id: string]: string[] }): void;
  supportedFilters: {
    [type: string]: (props: FieldFilterProps) => JSX.Element;
  };
}

export default AttributeValueFilter;
