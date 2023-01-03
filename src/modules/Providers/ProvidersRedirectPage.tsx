import * as React from 'react';
import Page from '_/components/RedirectPage';

const ProviderRedirectPage = () => (
  <Page gvk={{ group: 'forklift.konveyor.io', version: 'v1beta1', kind: 'Provider' }} />
);

export default ProviderRedirectPage;
