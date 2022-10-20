import { FilterDef } from './Filter/types';

export interface SortType {
  isAsc: boolean;
  id: string;
  tKey: string;
}

export interface Field {
  id: string;
  tKey: string;
  isVisible?: boolean;
  isIdentity?: boolean;
  sortable?: boolean;
  filter?: FilterDef;
  comparator?: (a: any, b: any, locale: string) => number;
}
