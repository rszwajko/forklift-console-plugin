import React from 'react';
import { StandardPage } from 'src/components/StandardPage';
import { Field } from 'src/components/types';
import { useTranslation } from 'src/internal/i18n';
import { ResourceConsolePageProps } from 'src/internal/k8s';
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

import { Button } from '@patternfly/react-core';

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

export const ProvidersPage = ({ namespace, kind }: ResourceConsolePageProps) => {
  const { t } = useTranslation();
  const dataSource = useProvidersWithInventory({
    kind,
    namespace,
  });

  return (
    <StandardPage<MergedProvider>
      addButton={
        <Button variant="primary" onClick={() => ''}>
          {t('Add Provider')}
        </Button>
      }
      dataSource={dataSource}
      RowMapper={ProviderRow}
      fieldsMetadata={fieldsMetadata}
      namespace={namespace}
      title={t('Providers')}
    />
  );
};

export default ProvidersPage;
