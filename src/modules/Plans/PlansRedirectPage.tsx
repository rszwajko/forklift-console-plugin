import * as React from 'react';
import Page from '_/components/RedirectPage';

const PlansRedirectPage = () => (
  <Page gvk={{ group: 'forklift.konveyor.io', version: 'v1beta1', kind: 'Plan' }} />
);

export default PlansRedirectPage;
