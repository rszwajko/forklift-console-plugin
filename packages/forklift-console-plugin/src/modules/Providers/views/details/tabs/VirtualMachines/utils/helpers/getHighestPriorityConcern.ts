import { ProviderVirtualMachine } from '@kubev2v/types';

import { hasConcerns } from './hasConcerns';

type ConcernCategory = 'Critical' | 'Warning' | 'Information';

export const getHighestPriorityConcern = (vm: ProviderVirtualMachine): ConcernCategory => {
  const concerns = hasConcerns(vm) ? vm.concerns : [];
  if (!concerns.length) {
    return undefined;
  }

  if (concerns.some((c) => c.category === 'Critical')) {
    return 'Critical';
  }

  if (concerns.some((c) => c.category === 'Warning')) {
    return 'Warning';
  }

  if (concerns.some((c) => c.category === 'Information')) {
    return 'Information';
  }

  return undefined;
};
