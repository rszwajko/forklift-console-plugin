import React, { useMemo, useState } from 'react';
import {
  AttributeValueFilter,
  createMetaMatcher,
  EnumFilter,
  FreetextFilter,
  PrimaryFilters,
} from 'src/components/Filter';
import { ManageColumnsToolbar, TableView } from 'src/components/TableView';
import { Field } from 'src/components/types';
import { useTranslation } from 'src/internal/i18n';
import {
  CLUSTER_COUNT,
  HOST_COUNT,
  NAME,
  NAMESPACE,
  NETWORK_COUNT,
  READY,
  STORAGE_COUNT,
  TYPE,
  URL,
  VM_COUNT,
} from 'src/utils/constants';

import { RedExclamationCircleIcon } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
  Level,
  LevelItem,
  PageSection,
  Spinner,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { SearchIcon } from '@patternfly/react-icons';

import { MergedProvider, useProvidersWithInventory } from './data';
import ProviderRow from './ProviderRow';

const fieldsMetadata: Field[] = [
  {
    id: NAME,
    toLabel: (t) => t('Name'),
    isVisible: true,
    isIdentity: true,
    filter: {
      type: 'freetext',
      toPlaceholderLabel: (t) => t('Filter by name'),
    },
    sortable: true,
  },
  {
    id: NAMESPACE,
    toLabel: (t) => t('Namespace'),
    isVisible: true,
    isIdentity: true,
    filter: {
      type: 'freetext',
      toPlaceholderLabel: (t) => t('Filter by namespace'),
    },
    sortable: true,
  },
  {
    id: READY,
    toLabel: (t) => t('Ready'),
    isVisible: true,
    filter: {
      type: 'enum',
      primary: true,
      toPlaceholderLabel: (t) => t('Ready'),
      values: [
        { id: 'True', toLabel: (t) => t('True') },
        { id: 'False', toLabel: (t) => t('False') },
        { id: 'Unknown', toLabel: (t) => t('Unknown') },
      ],
    },
    sortable: true,
  },
  {
    id: URL,
    toLabel: (t) => t('Endpoint'),
    isVisible: true,
    filter: {
      type: 'freetext',
      toPlaceholderLabel: (t) => t('Filter by endpoint'),
    },
    sortable: true,
  },
  {
    id: TYPE,
    toLabel: (t) => t('Type'),
    isVisible: true,
    filter: {
      type: 'enum',
      primary: true,
      toPlaceholderLabel: (t) => t('Type'),
      values: [
        // t('VMware')
        { id: 'vsphere', toLabel: (t) => t('VMware') },
        // t('oVirt')
        { id: 'ovirt', toLabel: (t) => t('oVirt') },
        // t('KubeVirt')
        { id: 'openshift', toLabel: (t) => t('KubeVirt') },
      ],
    },
    sortable: true,
  },
  {
    id: VM_COUNT,
    toLabel: (t) => t('VMs'),
    isVisible: true,
    sortable: true,
  },
  {
    id: NETWORK_COUNT,
    toLabel: (t) => t('Networks'),
    isVisible: true,
    sortable: true,
  },
  {
    id: CLUSTER_COUNT,
    toLabel: (t) => t('Clusters'),
    isVisible: true,
    sortable: true,
  },
  {
    id: HOST_COUNT,
    toLabel: (t) => t('Hosts'),
    isVisible: false,
    sortable: true,
  },
  {
    id: STORAGE_COUNT,
    toLabel: (t) => t('Storage'),
    isVisible: false,
    sortable: true,
  },
];

const useFields = (namespace, defaultFields) => {
  const [fields, setFields] = useState(defaultFields);
  const namespaceAwareFields = useMemo(
    () =>
      fields.map(({ id, isVisible, ...rest }) => ({
        id,
        ...rest,
        isVisible: id === NAMESPACE ? !namespace : isVisible,
      })),
    [namespace, fields],
  );
  return [namespaceAwareFields, setFields];
};

export const ProvidersPage = ({ namespace, kind }: ProvidersPageProps) => {
  const { t } = useTranslation();
  const [providers, loaded, error] = useProvidersWithInventory({
    kind,
    namespace,
  });
  const [selectedFilters, setSelectedFilters] = useState({});
  const clearAllFilters = () => setSelectedFilters({});
  const [fields, setFields] = useFields(namespace, fieldsMetadata);

  console.error('Providers', providers, fields, namespace, kind);

  const filteredProviders = providers.filter(
    createMetaMatcher(selectedFilters, fields),
  );

  const errorFetchingData = loaded && error;
  const noResults = loaded && !error && providers.length == 0;
  const noMatchingResults =
    loaded && !error && filteredProviders.length === 0 && providers.length > 0;

  return (
    <>
      <PageSection variant="light">
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{t('Providers')}</Title>
          </LevelItem>
          <LevelItem>
            <Button variant="primary" onClick={() => ''}>
              {t('Add Provider')}
            </Button>
          </LevelItem>
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
                filterTypes={fields.filter((field) => field.filter?.primary)}
                onFilterUpdate={setSelectedFilters}
                selectedFilters={selectedFilters}
                supportedFilters={{ enum: EnumFilter }}
              />
              <AttributeValueFilter
                filterTypes={fields.filter(
                  ({ filter }) => filter && !filter.primary,
                )}
                onFilterUpdate={setSelectedFilters}
                selectedFilters={selectedFilters}
                supportedFilters={{ freetext: FreetextFilter }}
              />
              <ManageColumnsToolbar
                columns={fields}
                defaultColumns={fieldsMetadata}
                setColumns={setFields}
                key={namespace ?? ''}
              />
            </ToolbarToggleGroup>
          </ToolbarContent>
        </Toolbar>
        <TableView<MergedProvider>
          entities={filteredProviders}
          allColumns={fields}
          visibleColumns={fields.filter(({ isVisible }) => isVisible)}
          aria-label={t('Providers')}
          Row={ProviderRow}
        >
          {[
            !loaded && <Loading />,
            errorFetchingData && <ErrorState />,
            noResults && <NoResultsFound />,
            noMatchingResults && (
              <NoResultsMatchFilter clearAllFilters={clearAllFilters} />
            ),
          ].filter(Boolean)}
        </TableView>
      </PageSection>
    </>
  );
};

const ErrorState = () => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateIcon icon={RedExclamationCircleIcon} />
      <Title headingLevel="h4" size="lg">
        {t('Unable to retrieve data')}
      </Title>
    </EmptyState>
  );
};

const Loading = () => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateIcon variant="container" component={Spinner} />
      <Title size="lg" headingLevel="h4">
        {t('Loading')}
      </Title>
    </EmptyState>
  );
};

const NoResultsFound = () => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateIcon icon={SearchIcon} />
      <Title size="lg" headingLevel="h4">
        {t('No results found')}
      </Title>
    </EmptyState>
  );
};

const NoResultsMatchFilter = ({
  clearAllFilters,
}: {
  clearAllFilters: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateIcon icon={SearchIcon} />
      <Title size="lg" headingLevel="h4">
        {t('No results found')}
      </Title>
      <EmptyStateBody>
        {t(
          'No results match the filter criteria. Clear all filters and try again.',
        )}
      </EmptyStateBody>
      <EmptyStatePrimary>
        <Button variant="link" onClick={clearAllFilters}>
          {t('Clear all filters')}
        </Button>
      </EmptyStatePrimary>
    </EmptyState>
  );
};

type ProvidersPageProps = {
  kind: string;
  namespace: string;
};

export default ProvidersPage;
