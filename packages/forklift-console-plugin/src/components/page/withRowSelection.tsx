import React from 'react';

import { RowProps, TableViewHeaderProps } from '@kubev2v/common';
import { Th } from '@patternfly/react-table';

export function withRowSelection<T>({ RowMapper, isSelected, canSelect, toggleSelectFor }) {
  const Enhanced = (props: RowProps<T>) => (
    <RowMapper
      {...props}
      isSelected={isSelected(props.resourceData)}
      toggleSelect={
        canSelect(props.resourceData) ? toggleSelectFor([props.resourceData]) : undefined
      }
    />
  );
  Enhanced.displayName = `EnhancedRowMapper`;
  return Enhanced;
}

export function withHeaderSelection<T>({ HeaderMapper, isSelected, canSelect, toggleSelectFor }) {
  const Enhanced = ({ dataOnScreen, ...other }: TableViewHeaderProps<T>) => {
    const selectableItems = dataOnScreen.filter(canSelect);
    const allSelected = selectableItems.every((it) => isSelected(it));
    return (
      <>
        <Th
          select={{
            onSelect: () => toggleSelectFor(selectableItems),
            isSelected: allSelected,
          }}
        />
        <HeaderMapper {...{ ...other, dataOnScreen }} />
      </>
    );
  };
  Enhanced.displayName = `EnhancedRowMapper`;
  return Enhanced;
}
