import React, { useState } from 'react';

import { InputGroup, SearchInput, ToolbarFilter } from '@patternfly/react-core';

import { FieldFilterProps } from './AttributeValueFilter';

const FreetextFilter = ({
  filterId,
  selectedFilters,
  onFilterUpdate,
  title,
  showFilter,
  placeholderLabel,
}: FieldFilterProps) => {
  const [inputValue, setInputValue] = useState('');
  const onTextInput = (): void => {
    if (!inputValue || selectedFilters.includes(inputValue)) {
      return;
    }
    onFilterUpdate([...selectedFilters, inputValue]);
    setInputValue('');
  };
  return (
    <ToolbarFilter
      key={filterId}
      chips={selectedFilters ?? []}
      deleteChip={(category, option) =>
        onFilterUpdate(
          selectedFilters?.filter((value) => value !== option) ?? [],
        )
      }
      deleteChipGroup={() => onFilterUpdate([])}
      categoryName={title}
      showToolbarItem={showFilter}
    >
      <InputGroup>
        <SearchInput
          placeholder={placeholderLabel}
          value={inputValue}
          onChange={setInputValue}
          onSearch={onTextInput}
          onClear={() => setInputValue('')}
        />
      </InputGroup>
    </ToolbarFilter>
  );
};

export default FreetextFilter;
