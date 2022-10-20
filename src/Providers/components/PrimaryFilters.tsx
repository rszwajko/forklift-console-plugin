import React from 'react';
import { useTranslation } from 'src/internal/i18n';

import { ToolbarGroup } from '@patternfly/react-core';

import { MetaFilterProps } from './AttributeValueFilter';

const PrimaryFilters = ({
  selectedFilters,
  onFilterUpdate,
  filterTypes,
  supportedFilters = {},
}: MetaFilterProps) => {
  const { t } = useTranslation();

  return (
    <ToolbarGroup variant="filter-group">
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
              title={t(filter.tKey ?? fieldKey)}
              showFilter={true}
              supportedValues={filter.values}
            />
          )
        );
      })}
    </ToolbarGroup>
  );
};

export default PrimaryFilters;
