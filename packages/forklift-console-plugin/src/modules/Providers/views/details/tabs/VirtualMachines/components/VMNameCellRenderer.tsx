import React from 'react';
import { TableCell } from 'src/modules/Providers/utils';

import { VMCellProps } from './VMCellProps';

export function VMNameCellRenderer<T extends { name: string }>({ data }: VMCellProps<T>) {
  return <TableCell>{data.name}</TableCell>;
}
