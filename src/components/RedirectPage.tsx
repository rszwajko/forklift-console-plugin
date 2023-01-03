import * as React from 'react';
import { Redirect } from 'react-router';
import { referenceFor } from '_/utils/resources';

import { K8sGroupVersionKind } from '@openshift-console/dynamic-plugin-sdk';

const RedirectPage = ({ gvk }: { gvk: K8sGroupVersionKind }) => (
  <Redirect to={`/k8s/all-namespaces/${referenceFor(gvk.group, gvk.version, gvk.kind)}`} />
);

export default RedirectPage;
