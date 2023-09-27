import React from 'react';
import { TableCell } from 'src/modules/Providers/utils';

import { ResourceField, RowProps } from '@kubev2v/common';
import { OpenshiftVM } from '@kubev2v/types';
import { Td, Tr } from '@patternfly/react-table';

import { PowerStateCellRenderer } from './components/PowerStateCellRenderer';
import { VMCellProps, VmData, VMNameCellRenderer } from './components';

const cellRenderers: Record<string, React.FC<VMCellProps>> = {
  name: VMNameCellRenderer,
  status: PowerStateCellRenderer,
  template: ({ data }) => (
    <TableCell>
      {(data?.vm as OpenshiftVM)?.object?.metadata?.labels?.['vm.kubevirt.io/template'] ?? ''}
    </TableCell>
  ),
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
  resourceData: VmData;
  resourceFieldId: string;
  resourceFields: ResourceField[];
}

export const OpenShiftVirtualMachinesRow: React.FC<RowProps<VmData>> = ({
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
