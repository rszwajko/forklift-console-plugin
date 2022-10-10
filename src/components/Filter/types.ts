export interface FilterDef {
  type: string;
  toPlaceholderLabel(t: (key: string) => string): string;
  values?: { id: string; toLabel(t: (key: string) => string): string }[];
  toLabel?(t: (key: string) => string): string;
  primary?: boolean;
}

export interface FieldFilterProps {
  filterId: string;
  onFilterUpdate(values: string[]);
  placeholderLabel: string;
  selectedFilters: string[];
  showFilter: boolean;
  title: string;
  supportedValues?: {
    id: string;
    toLabel(t: (key: string) => string): string;
  }[];
}

export type FilterType = {
  id: string;
  toLabel(t: (key: string) => string): string;
  filter: FilterDef;
};

export interface MetaFilterProps {
  selectedFilters: { [id: string]: string[] };
  filterTypes: FilterType[];
  onFilterUpdate(filters: { [id: string]: string[] }): void;
  supportedFilters: {
    [type: string]: (props: FieldFilterProps) => JSX.Element;
  };
}
