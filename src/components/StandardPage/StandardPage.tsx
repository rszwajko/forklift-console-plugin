import React, { useState } from 'react';
import {
  AttributeValueFilter,
  createMetaMatcher,
  EnumFilter,
  FreetextFilter,
  PrimaryFilters,
} from 'src/components/Filter';
import { FieldFilterProps, FilterType } from 'src/components/Filter/types';
import {
  ManageColumnsToolbar,
  RowProps,
  TableView,
} from 'src/components/TableView';
import { Field } from 'src/components/types';
import { useTranslation } from 'src/internal/i18n';

import {
  Level,
  LevelItem,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';

import {
  ErrorState,
  Loading,
  NoResultsFound,
  NoResultsMatchFilter,
} from './ResultStates';
import { useFields } from './useFields';

export interface StandardPageProps<T> {
  addButton?: JSX.Element;
  dataSource: [T[], boolean, boolean];
  fieldsMetadata: Field[];
  namespace: string;
  RowMapper: React.FunctionComponent<RowProps<T>>;
  supportedFilters?: {
    [type: string]: (props: FieldFilterProps) => JSX.Element;
  };
  title: string;
}

export function StandardPage<T>({
  namespace,
  dataSource: [flattenData, loaded, error],
  RowMapper,
  title,
  addButton,
  fieldsMetadata,
  supportedFilters = {
    enum: EnumFilter,
    freetext: FreetextFilter,
  },
}: StandardPageProps<T>) {
  const { t } = useTranslation();
  const [selectedFilters, setSelectedFilters] = useState({});
  const clearAllFilters = () => setSelectedFilters({});
  const [fields, setFields] = useFields(namespace, fieldsMetadata);

  const filteredData = flattenData.filter(
    createMetaMatcher(selectedFilters, fields),
  );

  const errorFetchingData = loaded && error;
  const noResults = loaded && !error && flattenData.length == 0;
  const noMatchingResults =
    loaded && !error && filteredData.length === 0 && flattenData.length > 0;

  return (
    <>
      <PageSection variant="light">
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{title}</Title>
          </LevelItem>
          {addButton && <LevelItem>{addButton}</LevelItem>}
        </Level>
      </PageSection>
      <PageSection>
        <Toolbar
          clearAllFilters={clearAllFilters}
          clearFiltersButtonText={t('Clear all filters')}
        >
          <ToolbarContent>
            <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
              <PrimaryFilters
                filterTypes={
                  fields.filter(
                    (field) => field.filter?.primary,
                  ) as FilterType[]
                }
                onFilterUpdate={setSelectedFilters}
                selectedFilters={selectedFilters}
                supportedFilters={supportedFilters}
              />
              <AttributeValueFilter
                filterTypes={
                  fields.filter(
                    ({ filter }) => filter && !filter.primary,
                  ) as FilterType[]
                }
                onFilterUpdate={setSelectedFilters}
                selectedFilters={selectedFilters}
                supportedFilters={supportedFilters}
              />
              <ManageColumnsToolbar
                columns={fields}
                defaultColumns={fieldsMetadata}
                setColumns={setFields}
              />
            </ToolbarToggleGroup>
          </ToolbarContent>
        </Toolbar>
        <TableView<T>
          entities={filteredData}
          allColumns={fields}
          visibleColumns={fields.filter(({ isVisible }) => isVisible)}
          aria-label={title}
          Row={RowMapper}
        >
          {[
            !loaded && <Loading key="loading" />,
            errorFetchingData && <ErrorState key="error" />,
            noResults && <NoResultsFound key="no_result" />,
            noMatchingResults && (
              <NoResultsMatchFilter
                key="no_match"
                clearAllFilters={clearAllFilters}
              />
            ),
          ].filter(Boolean)}
        </TableView>
      </PageSection>
    </>
  );
}

export default StandardPage;
