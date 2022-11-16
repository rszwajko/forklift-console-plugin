import { EncodedExtension } from '@openshift/dynamic-plugin-sdk';
import { ActionProvider, ResourceListPage } from '@openshift-console/dynamic-plugin-sdk';
import type { ConsolePluginMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack/lib/schema/plugin-package';

export const exposedModules: ConsolePluginMetadata['exposedModules'] = {
  ProvidersPage: './modules/Providers/ProvidersWrapper',
  useMergedProviders: './modules/Providers/UseMergedProviders',
};

export const extensions: EncodedExtension[] = [
  {
    type: 'console.page/resource/list',
    properties: {
      component: {
        $codeRef: 'ProvidersPage',
      },
      model: {
        group: 'forklift.konveyor.io',
        kind: 'Provider',
        version: 'v1beta1',
      },
    },
  } as EncodedExtension<ResourceListPage>,

  {
    type: 'console.action/provider',
    properties: {
      contextId: 'forklift-merged-provider',
      provider: {
        $codeRef: 'useMergedProviders',
      },
    },
  } as EncodedExtension<ActionProvider>,
];
