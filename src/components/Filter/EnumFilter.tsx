import React, { useMemo, useState } from 'react';
import { useTranslation } from 'src/internal/i18n';
import { localeCompare } from 'src/utils/helpers';

import {
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  ToolbarChip,
  ToolbarFilter,
} from '@patternfly/react-core';

import { FieldFilterProps } from './types';

export const useUnique = ({
  supportedEnumValues,
  onSelectedEnumIdsChange,
  selectedEnumIds,
}: {
  supportedEnumValues: {
    id: string;
    toLabel(t: (key: string) => string): string;
  }[];
  onSelectedEnumIdsChange: (values: string[]) => void;
  selectedEnumIds: string[];
}) => {
  const { t, i18n } = useTranslation();

  const translated = useMemo(
    () =>
      supportedEnumValues.map((it) => ({
        // fallback to ID
        label: it.toLabel?.(t) ?? it.id,
        id: it.id,
      })),

    [supportedEnumValues],
  );

  // one label may map to multiple filter ids i.e. "Unknown"
  // aggregate filters with the same label
  const labelToIds = useMemo(
    () =>
      translated.reduce((acc, { label, id }) => {
        acc[label] = [...(acc?.[label] ?? []), id];
        return acc;
      }, {}),
    [translated],
  );

  const idToLabel = useMemo(
    () =>
      translated.reduce((acc, { label, id }) => {
        acc[id] = label;
        return acc;
      }, {}),
    [translated],
  );

  const filterNames = useMemo(
    () =>
      Object.entries(labelToIds)
        .map(([label]) => label)
        .sort((a, b) => localeCompare(a, b, i18n.resolvedLanguage)),
    [labelToIds],
  );

  const onFilterUpdate = (labels: string[]): void =>
    onSelectedEnumIdsChange(labels.flatMap((label) => labelToIds[label] ?? []));

  const selectedFilters = [
    ...new Set(selectedEnumIds.map((id) => idToLabel[id]).filter(Boolean)),
  ] as string[];

  return { filterNames, onFilterUpdate, selectedFilters };
};

export const EnumFilter = ({
  selectedFilters: selectedEnumIds = [],
  onFilterUpdate: onSelectedEnumIdsChange,
  supportedValues: supportedEnumValues = [],
  title,
  placeholderLabel,
  filterId,
  showFilter,
}: FieldFilterProps) => {
  const [isExpanded, setExpanded] = useState(false);
  const { filterNames, onFilterUpdate, selectedFilters } = useUnique({
    supportedEnumValues,
    onSelectedEnumIdsChange,
    selectedEnumIds,
  });

  const deleteFilter = (
    label: string | ToolbarChip | SelectOptionObject,
  ): void =>
    onFilterUpdate(
      selectedFilters.filter((filterName) => filterName !== label),
    );

  const hasFilter = (label: string | SelectOptionObject): boolean =>
    !!selectedFilters.find((filterName) => filterName === label);

  const addFilter = (label: string | SelectOptionObject): void => {
    if (typeof label === 'string') {
      onFilterUpdate([...selectedFilters, label]);
    }
  };

  return (
    <ToolbarFilter
      key={filterId}
      chips={selectedFilters}
      deleteChip={(category, option) => deleteFilter(option)}
      deleteChipGroup={() => onFilterUpdate([])}
      categoryName={title}
      showToolbarItem={showFilter}
    >
      <Select
        variant={SelectVariant.checkbox}
        aria-label={placeholderLabel}
        onSelect={(event, option, isPlaceholder) => {
          if (isPlaceholder) {
            return;
          }
          hasFilter(option) ? deleteFilter(option) : addFilter(option);
        }}
        selections={selectedFilters}
        placeholderText={placeholderLabel}
        isOpen={isExpanded}
        onToggle={setExpanded}
      >
        {filterNames.map((label) => (
          <SelectOption key={label} value={label} />
        ))}
      </Select>
    </ToolbarFilter>
  );
};
