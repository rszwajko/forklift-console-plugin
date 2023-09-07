import React from 'react';
import { TableCell } from 'src/modules/Providers/utils';

import { ResourceField, RowProps } from '@kubev2v/common';
import { VSphereVM } from '@kubev2v/types';
import { Td, Tr } from '@patternfly/react-table';

import { VMCellProps, VMConcernsCellRenderer, VMNameCellRenderer } from './components';

export interface VmData {
  vm: VSphereVM;
  name: string;
  concerns: string;
}

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

const cellRenderers: Record<string, React.FC<VMCellProps<VmData>>> = {
  name: VMNameCellRenderer,
  concerns: VMConcernsCellRenderer,
  host: ({ data }) => <TableCell>{data?.vm?.host}</TableCell>,
  isTemplate: ({ data }) => <TableCell>{Boolean(data?.vm?.isTemplate).toString()}</TableCell>,
  path: ({ data }) => <TableCell>{data?.vm?.path}</TableCell>,
  status: ({ data }) => <TableCell>{data?.vm?.powerState}</TableCell>,
};

export const VSphereVirtualMachinesRow: React.FC<RowProps<VmData>> = ({
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
