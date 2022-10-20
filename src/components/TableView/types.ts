import { Field } from '../types';

export interface Column {
  id: string;
  tKey: string;
  sortable?: boolean;
}

export interface RowProps<T> {
  columns: Field[];
  entity: T;
}
