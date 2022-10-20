import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk';
import type {
  HorizontalNavTab,
  HrefNavItem,
  NavSection,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceNSNavItem,
  RoutePage,
  Separator,
} from '@openshift-console/dynamic-plugin-sdk';

const extensions: EncodedExtension[] = [
  {
    type: 'console.navigation/section',
    properties: {
      id: 'virtualization',
      name: '%plugin__kubevirt-plugin~Virtualization%',
      insertAfter: 'workloads',
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-sec-virtualization',
        'data-test-id': 'virtualization-nav-item',
      },
    },
    flags: {
      disallowed: ['KUBEVIRT_DYNAMIC'],
    },
  } as EncodedExtension<NavSection>,

  {
    type: 'console.navigation/separator',
    properties: {
      perspective: 'admin',
      section: 'virtualization',
      id: 'importSeparator',
      insertAfter: 'migrationpolicies',
      testID: 'ImportSeparator',
    },
    flags: {
      required: ['KUBEVIRT_DYNAMIC'],
    },
  } as EncodedExtension<Separator>,

  {
    type: 'console.navigation/resource-ns',
    properties: {
      id: 'providers',
      section: 'virtualization',
      name: '%plugin__forklift-console-plugin~Providers for VM Import%',
      model: {
        group: 'forklift.konveyor.io',
        kind: 'Provider',
        version: 'v1beta1',
      },
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-providers',
        'data-test-id': 'providers-nav-item',
      },
    },
  } as EncodedExtension<ResourceNSNavItem>,

  {
    type: 'console.page/resource/list',
    properties: {
      component: {
        $codeRef: 'ProvidersRes',
      },
      model: {
        group: 'forklift.konveyor.io',
        kind: 'Provider',
        version: 'v1beta1',
      },
    },
  } as EncodedExtension<ResourceListPage>,

  {
    type: 'console.page/resource/details',
    properties: {
      model: {
        group: 'forklift.konveyor.io',
        kind: 'Provider',
        version: 'v1beta1',
      },
      component: {
        $codeRef: 'EmptyDetailPage',
      },
    },
  } as EncodedExtension<ResourceDetailsPage>,

  {
    type: 'console.tab/horizontalNav',
    properties: {
      model: {
        group: 'forklift.konveyor.io',
        kind: 'Provider',
        version: 'v1beta1',
      },
      page: {
        name: 'Inventory',
        href: 'inventory',
      },
      component: {
        $codeRef: 'ProviderInventoryTab',
      },
    },
  } as EncodedExtension<HorizontalNavTab>,

  {
    type: 'console.navigation/href',
    properties: {
      id: 'providers',
      insertAfter: 'importSeparator',
      perspective: 'admin',
      section: 'virtualization',
      name: '%plugin__forklift-console-plugin~Providers for VM Import%',
      href: '/mtv/providers',
    },
  } as EncodedExtension<HrefNavItem>,

  {
    type: 'console.navigation/href',
    properties: {
      id: 'plans',
      insertAfter: 'providers',
      section: 'virtualization',
      name: '%plugin__forklift-console-plugin~Plans for VM Import%',
      href: '/mtv/plans',
    },
  } as EncodedExtension<HrefNavItem>,

  {
    type: 'console.navigation/href',
    properties: {
      id: 'mappings',
      insertAfter: 'plans',
      perspective: 'admin',
      section: 'virtualization',
      name: '%plugin__forklift-console-plugin~Mappings for VM Import%',
      href: '/mtv/mappings',
    },
  } as EncodedExtension<HrefNavItem>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'ProvidersPage',
      },
      path: ['/mtv/providers', '/mtv/providers/:providerType'],
      exact: true,
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'HostsPage',
      },
      path: '/mtv/providers/vsphere/:providerName',
      exact: false,
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'PlansPage',
      },
      path: '/mtv/plans',
      exact: true,
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'PlanWizard',
      },
      path: '/mtv/plans/create',
      exact: true,
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'PlanWizard',
      },
      path: ['/mtv/plans/:planName/edit', '/mtv/plans/:planName/duplicate'],
      exact: false,
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'VMMigrationDetails',
      },
      path: '/mtv/plans/:planName',
      exact: false,
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.page/route',
    properties: {
      component: {
        $codeRef: 'MappingsPage',
      },
      path: '/mtv/mappings',
      exact: true,
    },
  } as EncodedExtension<RoutePage>,
];

export default extensions;
