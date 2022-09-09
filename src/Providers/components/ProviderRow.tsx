import React from 'react';
import { useTranslation } from 'src/internal/i18n';
import { ProviderResource } from 'src/internal/k8s';

import { getMostSeriousCondition, getStatusType } from '@app/common/helpers';
import { IStatusCondition } from '@app/queries/types';
import { StatusIcon } from '@migtools/lib-ui';
import { Button, Popover } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';

import { NAME, READY, TYPE, URL } from './shared';
import { RowProps } from './TableView';
interface CellProps {
  value: string;
  resource: ProviderResource;
  t(key: string): string;
}
const StatusCell = ({ value, resource, t }: CellProps) => {
  return (
    <Popover
      hasAutoWidth
      bodyContent={
        <div>
          {resource?.status?.conditions?.map((condition) => {
            const severity = getMostSeriousCondition([
              condition as IStatusCondition,
            ]);
            return (
              <StatusIcon
                key={condition.message}
                status={getStatusType(severity)}
                label={condition.message}
              />
            );
          }) ?? 'No information'}
        </div>
      }
    >
      <Button variant="link" isInline aria-label={t(value)}>
        <StatusIcon
          status={value === 'Yes' ? 'Ok' : 'Error'}
          label={t(value)}
        />
      </Button>
    </Popover>
  );
};

const TextCell = ({ value }: CellProps) => <>{value}</>;

const cellCreator = {
  [NAME]: TextCell,
  [READY]: StatusCell,
  [URL]: TextCell,
  [TYPE]: TextCell,
};

const ProviderRow = ({ columns, resource }: RowProps<ProviderResource>) => {
  const { t } = useTranslation();

  return (
    <Tr>
      {columns.map(({ id, tKey, toValue }) => (
        <Td key={id} dataLabel={t(tKey)}>
          {cellCreator?.[id]({ t, value: toValue(resource), resource }) ?? null}
        </Td>
      ))}
    </Tr>
  );
};

export default ProviderRow;
