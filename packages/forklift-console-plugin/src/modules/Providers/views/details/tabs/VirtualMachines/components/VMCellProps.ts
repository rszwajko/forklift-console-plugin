import { ResourceField } from '@kubev2v/common';
import { ProviderType, ProviderVirtualMachine } from '@kubev2v/types';

export interface VmData {
  vm: ProviderVirtualMachine;
  name: string;
  concerns: string;
}

export interface VMCellProps {
  providerType: ProviderType;
  data: VmData;
  fieldId: string;
  fields: ResourceField[];
}
