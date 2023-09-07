import React from 'react';

import { ResourceField, RowProps } from '@kubev2v/common';
import { OpenshiftVM } from '@kubev2v/types';
import { Td, Tr } from '@patternfly/react-table';

import { VmData } from './components/ProviderVirtualMachinesList';
import { VMCellProps, VMConcernsCellRenderer, VMNameCellRenderer } from './components';

export interface OpenShiftData extends VmData {
  vm: OpenshiftVM;
}

const cellRenderers: Record<string, React.FC<VMCellProps<VmData>>> = {
  name: VMNameCellRenderer,
  concerns: VMConcernsCellRenderer,
};

const renderTd = ({ resourceData, resourceFieldId, resourceFields }: RenderTdProps) => {
  const fieldId = resourceFieldId;

  const CellRenderer = cellRenderers?.[fieldId] ?? (() => <></>);
  return (
    <Td key={fieldId} dataLabel={fieldId}>
      <CellRenderer data={resourceData} fieldId={fieldId} fields={resourceFields} />
    </Td>
  );
};

interface RenderTdProps {
  resourceData: OpenShiftData;
  resourceFieldId: string;
  resourceFields: ResourceField[];
}

export const OpenShiftVirtualMachinesRow: React.FC<RowProps<OpenShiftData>> = ({
  resourceFields,
  resourceData,
}) => {
  return (
    <Tr>
      {resourceFields?.map(({ resourceFieldId }) =>
        renderTd({ resourceData, resourceFieldId, resourceFields }),
      )}
    </Tr>
  );
};
