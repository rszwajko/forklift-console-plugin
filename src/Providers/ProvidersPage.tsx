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
    tKey: 'Name',
    isVisible: true,
    isIdentity: true,
    filter: {
      type: 'freetext',
      placeholderKey: 'FilterByName',
    },
    sortable: true,
  },
  {
    id: NAMESPACE,
    tKey: 'Namespace',
    isVisible: true,
    isIdentity: true,
    filter: {
      type: 'freetext',
      placeholderKey: 'FilterByNamespace',
    },
    sortable: true,
  },
  {
    id: READY,
    tKey: 'Ready',
    isVisible: true,
    filter: {
      type: 'enum',
      primary: true,
      placeholderKey: 'Ready',
      values: [
        { id: 'True', tKey: 'True' },
        { id: 'False', tKey: 'False' },
        { id: 'Unknown', tKey: 'Unknown' },
      ],
    },
    sortable: true,
  },
  {
    id: URL,
    tKey: 'Url',
    isVisible: true,
    filter: {
      type: 'freetext',
      placeholderKey: 'FilterByUrl',
    },
    sortable: true,
  },
  {
    id: TYPE,
    tKey: 'Type',
    isVisible: true,
    filter: {
      type: 'enum',
      primary: true,
      placeholderKey: 'Type',
      values: [
        { id: 'vsphere', tKey: 'Vsphere' },
        { id: 'ovirt', tKey: 'Ovirt' },
        { id: 'openshift', tKey: 'Openshift' },
      ],
    },
    sortable: true,
  },
  {
    id: VM_COUNT,
    tKey: 'VMs',
    isVisible: true,
    sortable: true,
  },
  {
    id: NETWORK_COUNT,
    tKey: 'Networks',
    isVisible: true,
    sortable: true,
  },
  {
    id: CLUSTER_COUNT,
    tKey: 'Clusters',
    isVisible: true,
    sortable: true,
  },
  {
    id: HOST_COUNT,
    tKey: 'Hosts',
    isVisible: false,
    sortable: true,
  },
  {
    id: STORAGE_COUNT,
    tKey: 'Storage',
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

  return (
    <>
      <PageSection variant="light">
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{t('Providers')}</Title>
          </LevelItem>
          <LevelItem>
            <Button variant="primary" onClick={() => ''}>
              {t('AddProvider')}
            </Button>
          </LevelItem>
        </Level>
      </PageSection>
      <PageSection>
        <Toolbar
          clearAllFilters={clearAllFilters}
          clearFiltersButtonText={t('ClearAllFilters')}
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
            loaded && error && <ErrorState />,
            loaded && !error && providers.length == 0 && <NoResultsFound />,
            loaded &&
              !error &&
              filteredProviders.length === 0 &&
              providers.length > 0 && (
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
        {t('UnableToRetrieve')}
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
        {t('NoResultsFound')}
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
        {t('NoResultsFound')}
      </Title>
      <EmptyStateBody>{t('NoResultsMatchFilter')}</EmptyStateBody>
      <EmptyStatePrimary>
        <Button variant="link" onClick={clearAllFilters}>
          {t('ClearAllFilters')}
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
