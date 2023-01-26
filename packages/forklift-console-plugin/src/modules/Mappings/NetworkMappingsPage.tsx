import React, { useState } from 'react';
import { loadUserSettings, StandardPage, UserSettings } from 'common/src/components/StandardPage';
import { Field } from 'common/src/components/types';
import * as C from 'src/utils/constants';
import { useTranslation } from 'src/utils/i18n';
import { groupVersionKindForReference } from 'src/utils/resources';
import { ResourceConsolePageProps } from 'src/utils/types';

import { FlatNetworkMapping, useFlaNetworkMappings } from './data';
import NetworkMappingRow from './NetworkMappingRow';

const byName = {
  isVisible: true,
  filter: {
    type: 'freetext',
    toPlaceholderLabel: (t) => t('Filter by name'),
  },
  sortable: true,
};

export const fieldsMetadata: Field[] = [
  {
    id: C.NAME,
    toLabel: (t) => t('Name'),
    ...byName,
    isIdentity: true,
  },
  {
    id: C.NAMESPACE,
    toLabel: (t) => t('Namespace'),
    isVisible: true,
    isIdentity: true,
    filter: {
      toPlaceholderLabel: (t) => t('Filter by namespace'),
      type: 'freetext',
    },
    sortable: true,
  },
  {
    id: C.SOURCE,
    toLabel: (t) => t('Source provider'),
    ...byName,
  },
  {
    id: C.TARGET,
    toLabel: (t) => t('Target provider'),
    ...byName,
  },

  {
    id: C.FROM,
    toLabel: (t) => t('From'),
    isVisible: true,
    filter: {
      type: 'freetext',
      toPlaceholderLabel: (t) => t('Filter by name'),
    },
    sortable: false,
  },
  {
    id: C.TO,
    toLabel: (t) => t('To'),
    isVisible: true,
    filter: {
      type: 'freetext',
      toPlaceholderLabel: (t) => t('Filter by name'),
    },
    sortable: false,
  },
  {
    id: C.ACTIONS,
    toLabel: () => '',
    isVisible: true,
    sortable: false,
  },
];

export const NetworkMappingsPage = ({ namespace, kind: reference }: ResourceConsolePageProps) => {
  const { t } = useTranslation();
  const [userSettings] = useState(() => loadUserSettings({ pageId: 'NetworkMappings' }));
  const dataSource = useFlaNetworkMappings({
    namespace,
    groupVersionKind: groupVersionKindForReference(reference),
  });

  return (
    <PageMemo
      dataSource={dataSource}
      namespace={namespace}
      title={t('Network Mappings')}
      userSettings={userSettings}
    />
  );
};
NetworkMappingsPage.displayName = 'NetworkMappingsPage';

const Page = ({
  dataSource,
  namespace,
  title,
  userSettings,
}: {
  dataSource: [FlatNetworkMapping[], boolean, boolean];
  namespace: string;
  title: string;
  userSettings: UserSettings;
}) => (
  <StandardPage<FlatNetworkMapping>
    dataSource={dataSource}
    RowMapper={NetworkMappingRow}
    fieldsMetadata={fieldsMetadata}
    namespace={namespace}
    title={title}
    userSettings={userSettings}
  />
);

const PageMemo = React.memo(Page);

export default NetworkMappingsPage;
