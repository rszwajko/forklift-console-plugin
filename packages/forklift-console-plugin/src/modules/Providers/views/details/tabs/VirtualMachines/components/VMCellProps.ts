import { ResourceField } from '@kubev2v/common';

export interface VMCellProps<T> {
  data: T;
  fieldId: string;
  fields: ResourceField[];
}
