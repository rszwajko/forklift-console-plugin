export interface FilterDef {
  type: string;
  placeholderKey: string;
  values?: { id: string; tKey: string }[];
  tKey?: string;
  primary?: boolean;
}

export interface FieldFilterProps {
  filterId: string;
  onFilterUpdate(values: string[]);
  placeholderLabel: string;
  selectedFilters: string[];
  showFilter: boolean;
  title: string;
  supportedValues?: { id: string; tKey?: string }[];
}

export interface MetaFilterProps {
  selectedFilters: { [id: string]: string[] };
  filterTypes: {
    id: string;
    tKey: string;
    filter: FilterDef;
  }[];
  onFilterUpdate(filters: { [id: string]: string[] }): void;
  supportedFilters: {
    [type: string]: (props: FieldFilterProps) => JSX.Element;
  };
}
