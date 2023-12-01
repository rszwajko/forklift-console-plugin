import React, { useState } from 'react';
import StandardPage from 'src/components/page/StandardPage';
import { withSelection } from 'src/components/page/withSelection';
import { useProviderInventory } from 'src/modules/Providers/hooks';
import { useModal } from 'src/modules/Providers/modals';
import { useForkliftTranslation } from 'src/utils/i18n';

import { loadUserSettings, ResourceFieldFactory } from '@kubev2v/common';
import { HostModelGroupVersionKind, V1beta1Host, VSphereHost } from '@kubev2v/types';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Button, ToolbarItem } from '@patternfly/react-core';

import { VSphereNetworkModal } from './modals/VSphereNetworkModal';
import { InventoryHostPair, matchHostsToInventory } from './utils/helpers';
import { ProviderHostsProps } from './ProviderHosts';
import { VSphereHostsRow } from './VSphereHostsRow';

export const hostsFieldsMetadataFactory: ResourceFieldFactory = (t) => [
  {
    resourceFieldId: 'name',
    jsonPath: '$.inventory.name',
    label: t('Name'),
    isVisible: true,
    isIdentity: true, // Name is sufficient ID when Namespace is pre-selected
    filter: {
      type: 'freetext',
      placeholderLabel: t('Filter by name'),
    },
    sortable: true,
  },
  {
    resourceFieldId: 'network',
    jsonPath: '$.networkAdapter.name',
    label: t('Network for data transfer'),
    isVisible: true,
    filter: {
      type: 'freetext',
      placeholderLabel: t('Filter by network'),
    },
    sortable: true,
  },
  {
    resourceFieldId: 'linkSpeed',
    jsonPath: '$.networkAdapter.linkSpeed',
    label: t('Bandwidth'),
    isVisible: true,
    sortable: true,
  },
  {
    resourceFieldId: 'mtu',
    jsonPath: '$.networkAdapter.mtu',
    label: t('MTU'),
    isVisible: true,
    sortable: true,
  },
];

export const VSphereHostsList: React.FC<ProviderHostsProps> = ({ obj }) => {
  const { t } = useForkliftTranslation();
  const { showModal } = useModal();

  const [userSettings] = useState(() => loadUserSettings({ pageId: 'ProviderHosts' }));

  const { provider, permissions } = obj;
  const { namespace } = provider?.metadata || {};

  const {
    inventory: hostsInventory,
    loading,
    error,
  } = useProviderInventory<VSphereHost[]>({
    provider,
    subPath: 'hosts?detail=4',
  });

  const [hosts] = useK8sWatchResource<V1beta1Host[]>({
    groupVersionKind: HostModelGroupVersionKind,
    namespaced: true,
    isList: true,
    namespace,
  });

  const hostsData = matchHostsToInventory(hostsInventory, hosts, provider);

  const Page = permissions.canPatch
    ? withSelection<InventoryHostPair>({
        toId: (item: InventoryHostPair) => item.inventory.id,
        canSelect: (item: InventoryHostPair) => item?.inventory?.networkAdapters?.length > 0,
        actions: [
          ({ selectedIds }) => (
            <ToolbarItem>
              <Button
                variant="secondary"
                onClick={() =>
                  showModal(
                    <VSphereNetworkModal
                      provider={provider}
                      data={hostsData}
                      selected={selectedIds}
                    />,
                  )
                }
                isDisabled={selectedIds.length === 0}
              >
                {t('Select migration network')}
              </Button>
            </ToolbarItem>
          ),
        ],
      })
    : StandardPage<InventoryHostPair>;

  return (
    <Page
      data-testid="hosts-list"
      dataSource={[hostsData || [], !loading, error]}
      RowMapper={VSphereHostsRow}
      fieldsMetadata={hostsFieldsMetadataFactory(t)}
      namespace={namespace}
      title={t('Hosts')}
      userSettings={userSettings}
    />
  );
};
