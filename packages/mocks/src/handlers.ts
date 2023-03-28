import { rest } from 'msw';

const ENV = { PLUGIN_NAME: 'forklift-console-plugin' };

const openshiftProvider1 = {
  uid: 'mock-uid-ocpv-1',
  namespace: 'openshift-migration',
  name: 'ocpv-1',
  selfLink: '/foo/openshiftprovider/1',
  type: 'openshift',
  vmCount: 26,
  networkCount: 8,
};

export const getInventoryApiUrl = (relativePath?: string): string =>
  `/api/proxy/plugin/${ENV.PLUGIN_NAME}/forklift-inventory/${relativePath || ''}`;

export const handlers = [
  rest.get(getInventoryApiUrl('providers'), (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        vsphere: [],
        ovirt: [],
        openstack: [],
        openshift: [openshiftProvider1],
      }),
    ),
  ),
];
