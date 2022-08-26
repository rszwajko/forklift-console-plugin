import React, { useState } from 'react';
import { useTranslation } from 'src/internal/i18n';
import { ProviderResource } from 'src/internal/k8s';

import { MOCK_CLUSTER_PROVIDERS } from '@app/queries/mocks/providers.mock';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Level,
  LevelItem,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons';

import AttributeValueFilter from './components/AttributeValueFilter';
import EnumFilter from './components/EnumFilter';
import FreetextFilter from './components/FreetextFilter';
import PrimaryFilters from './components/PrimaryFilters';
import ProviderRow from './components/ProviderRow';
import { createMetaMatcher, Field } from './components/shared';
import { NAME, READY, TYPE, URL } from './components/shared';
import TableView from './components/TableView';

const isMock = process.env.DATA_SOURCE === 'mock';

const useProviders = ({ kind, namespace }) => {
  const [providers, loaded, error] = isMock
    ? [MOCK_CLUSTER_PROVIDERS, true, false]
    : useK8sWatchResource<ProviderResource[]>({
        kind,
        isList: true,
        namespaced: true,
        namespace,
      });

  // const inventoryProvidersQuery = useInventoryProvidersQuery();
  // providers.map(p => enhanceWithInventory(inventoryProvidersQuery))

  // const allErrorTitles = [
  //   'Cannot load providers from cluster API',
  //   'Cannot load providers from inventory API',
  // ];

  return [providers, loaded, error];
};

const fields: Field[] = [
  {
    id: NAME,
    tKey: 'plugin__forklift-console-plugin~Name',
    filter: {
      type: 'freetext',
      placeholderKey: 'plugin__forklift-console-plugin~FilterByName',
    },
    sortable: true,
    toValue: (provider) => provider?.metadata?.name ?? '',
  },
  {
    id: READY,
    tKey: 'plugin__forklift-console-plugin~Ready',
    filter: {
      type: 'enum',
      primary: true,
      placeholderKey: 'plugin__forklift-console-plugin~Ready',
      values: [
        { id: 'Yes', tKey: 'plugin__forklift-console-plugin~Yes' },
        { id: 'No', tKey: 'plugin__forklift-console-plugin~No' },
      ],
    },
    sortable: true,
    toValue: (provider) =>
      provider?.status?.conditions?.find(({ type }) => type === 'Ready')
        ?.status === 'True'
        ? 'Yes'
        : 'No',
  },
  {
    id: URL,
    tKey: 'plugin__forklift-console-plugin~Url',
    filter: {
      type: 'freetext',
      placeholderKey: 'plugin__forklift-console-plugin~FilterByUrl',
    },
    sortable: true,
    toValue: (provider) => provider?.spec?.url ?? '',
  },
  {
    id: TYPE,
    tKey: 'plugin__forklift-console-plugin~Type',
    filter: {
      type: 'enum',
      primary: true,
      placeholderKey: 'plugin__forklift-console-plugin~Type',
      values: [
        { id: 'vsphere', tKey: 'plugin__forklift-console-plugin~Vsphere' },
        { id: 'ovirt', tKey: 'plugin__forklift-console-plugin~Ovirt' },
        { id: 'openshift', tKey: 'plugin__forklift-console-plugin~Openshift' },
      ],
    },
    sortable: true,
    toValue: (provider) => provider?.spec?.type ?? '',
  },
];

export const ProvidersPage = ({ namespace, kind }: ProvidersPageProps) => {
  const { t } = useTranslation();
  const [providers, loaded, error] = useProviders({ kind, namespace });
  const [selectedFilters, setSelectedFilters] = useState({});

  console.error('Providers', providers, fields, selectedFilters);

  return (
    <>
      <PageSection variant="light">
        <Level>
          <LevelItem>
            <Title headingLevel="h1">
              {t('plugin__forklift-console-plugin~Providers')}
            </Title>
          </LevelItem>
          <LevelItem>
            <Button variant="primary" onClick={() => ''}>
              {t('plugin__forklift-console-plugin~AddProvider')}
            </Button>
          </LevelItem>
        </Level>
      </PageSection>
      <PageSection>
        <Toolbar clearAllFilters={() => setSelectedFilters({})}>
          <ToolbarContent>
            <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
              <PrimaryFilters
                filterTypes={fields.filter((field) => field.filter.primary)}
                onFilterUpdate={setSelectedFilters}
                selectedFilters={selectedFilters}
                supportedFilters={{ enum: EnumFilter }}
              />
              <AttributeValueFilter
                filterTypes={fields.filter((field) => !field.filter.primary)}
                onFilterUpdate={setSelectedFilters}
                selectedFilters={selectedFilters}
                supportedFilters={{ freetext: FreetextFilter }}
              />
            </ToolbarToggleGroup>
          </ToolbarContent>
        </Toolbar>

        {loaded && error && <Errors />}
        {!loaded && <Loading />}
        {loaded && !error && (
          <TableView<ProviderResource>
            resources={providers.filter(
              createMetaMatcher(selectedFilters, fields),
            )}
            fields={fields}
            aria-label={t('plugin__forklift-console-plugin~Providers')}
            Row={ProviderRow}
          />
        )}
      </PageSection>
    </>
  );
};

const Errors = () => <> Erorrs!</>;

const Loading = () => <> Loading!</>;

type ProvidersPageProps = {
  kind: string;
  namespace: string;
};

export default ProvidersPage;
