import React, { useState } from 'react';

import { GlobalActionToolbarProps, RowProps, TableViewHeaderProps } from '@kubev2v/common';
import { Th } from '@patternfly/react-table';

import StandardPage, { StandardPageProps } from './StandardPage';

export function withRowSelection<T>({ RowMapper, isSelected, toggleSelectFor }) {
  const Enhanced = (props: RowProps<T>) => (
    <RowMapper
      {...props}
      isSelected={isSelected(props.resourceData)}
      toggleSelect={toggleSelectFor([props.resourceData])}
    />
  );
  Enhanced.displayName = `${RowMapper.displayName || 'RowMapper'}WithSelection`;
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
            isHeaderSelectDisabled: selectableItems.length === 0, // Disable if no selectable items
          }}
        />
        <HeaderMapper {...{ ...other, dataOnScreen }} />
      </>
    );
  };
  Enhanced.displayName = `${HeaderMapper.displayName || 'HeaderMapper'}WithSelection`;
  return Enhanced;
}

export function withSelection<T>({
  toId,
  canSelect,
  actions,
}: {
  toId: (item: T) => string;
  canSelect: (item: T) => boolean;
  actions: ((props: GlobalActionToolbarProps<T>) => JSX.Element)[];
}) {
  const Enhanced = (props: StandardPageProps<T>) => {
    const [selectedIds, setSelectedIds]: [string[], (selected: string[]) => void] = useState([]);
    const isSelected = (item: T) => selectedIds.includes(toId(item));
    const toggleSelectFor = (items: T[]) => {
      const ids = items.map(toId);
      const allSelected = ids.every((id) => selectedIds.includes(id));
      setSelectedIds([
        ...selectedIds.filter((it) => !ids.includes(it)),
        ...(allSelected ? [] : ids),
      ]);
    };
    return (
      <StandardPage
        {...props}
        RowMapper={withRowSelection({
          RowMapper: props.RowMapper,
          isSelected,
          toggleSelectFor,
        })}
        HeaderMapper={withHeaderSelection({
          HeaderMapper: props.HeaderMapper,
          canSelect,
          isSelected,
          toggleSelectFor,
        })}
        GlobalActionToolbarItems={actions}
      />
    );
  };
  return Enhanced;
}
