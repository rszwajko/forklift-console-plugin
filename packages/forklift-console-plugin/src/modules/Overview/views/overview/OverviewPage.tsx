import React from 'react';

import { HorizontalNav, K8sModel, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

import './OverviewPage.style.css';

export const OverviewPage: React.FC<OverviewPageProps> = () => {
  return (
    <>
      <HorizontalNav
        pages={[
          {
            href: '',
            name: 'Overview',
            component: () => (
              <>
                <div style={{ width: '300px', height: '300px', background: 'green' }} />
                <ResourceLink
                  groupVersionKind={{ version: 'v1', kind: 'Namespace' }}
                  name={'konveyor-forklift'}
                  namespace={''}
                />
              </>
            ),
          },
        ]}
      />
    </>
  );
};
OverviewPage.displayName = 'OverviewPage';

type OverviewPageProps = {
  kind: string;
  kindObj: K8sModel;
  match: { path: string; url: string; isExact: boolean; params: unknown };
  name: string;
  namespace?: string;
};

export default OverviewPage;
