import React from 'react';
import { TableCell } from 'src/modules/Providers/utils';

import { ResourceField, RowProps } from '@kubev2v/common';
import { OpenstackVM } from '@kubev2v/types';
import { Td, Tr } from '@patternfly/react-table';

import { VMCellProps, VMConcernsCellRenderer, VMNameCellRenderer } from './components';

export interface VmData {
  vm: OpenstackVM;
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
  hostID: ({ data }) => <TableCell>{data?.vm?.hostID}</TableCell>,
  path: ({ data }) => <TableCell>{data?.vm?.path}</TableCell>,
  status: ({ data }) => <TableCell>{data?.vm?.status}</TableCell>,
  tenantID: ({ data }) => <TableCell>{data?.vm?.tenantID}</TableCell>,
  imageID: ({ data }) => <TableCell>{data?.vm?.imageID}</TableCell>,
  flavorID: ({ data }) => <TableCell>{data?.vm?.flavorID}</TableCell>,
};

export const OpenStackVirtualMachinesRow: React.FC<RowProps<VmData>> = ({
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
