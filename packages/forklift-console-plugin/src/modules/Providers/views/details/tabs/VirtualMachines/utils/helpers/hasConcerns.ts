import { Concern, OVirtVM, ProviderVirtualMachine } from '@kubev2v/types';

export function hasConcerns(
  vm: ProviderVirtualMachine,
): vm is ProviderVirtualMachine & { concerns: Concern[] } {
  return Array.isArray((vm as OVirtVM).concerns);
}
