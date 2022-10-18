import React from 'react';
import { useTranslation } from 'src/internal/i18n';

import { ToolbarGroup } from '@patternfly/react-core';

import { MetaFilterProps } from './types';

export const PrimaryFilters = ({
  selectedFilters,
  onFilterUpdate,
  filterTypes,
  supportedFilters = {},
}: MetaFilterProps) => {
  const { t } = useTranslation();

  return (
    <ToolbarGroup variant="filter-group">
      {filterTypes.map(({ id, toLabel: toFieldLabel, filter }) => {
        const FieldFilter = supportedFilters[filter.type];
        return (
          FieldFilter && (
            <FieldFilter
              key={id}
              filterId={id}
              onFilterUpdate={(values) =>
                onFilterUpdate({
                  ...selectedFilters,
                  [id]: values,
                })
              }
              placeholderLabel={filter.toPlaceholderLabel(t)}
              selectedFilters={selectedFilters[id] ?? []}
              title={filter?.toLabel?.(t) ?? toFieldLabel(t)}
              showFilter={true}
              supportedValues={filter.values}
            />
          )
        );
      })}
    </ToolbarGroup>
  );
};
