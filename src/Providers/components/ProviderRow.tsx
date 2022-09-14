import React from 'react';
import { useTranslation } from 'src/internal/i18n';
import { ProviderResource } from 'src/internal/k8s';

import { getMostSeriousCondition, getStatusType } from '@app/common/helpers';
import { IStatusCondition } from '@app/queries/types';
import { StatusIcon } from '@migtools/lib-ui';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Popover } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';

import { NAME, NAMESPACE, READY, TYPE, URL } from './shared';
import { RowProps } from './TableView';
interface CellProps {
  value: string;
  resource: ProviderResource;
  t(key: string): string;
  kind: string;
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

const ProviderLink = ({ value, resource, kind }: CellProps) => (
  <ResourceLink
    kind={kind}
    name={value}
    namespace={resource?.metadata?.namespace}
  />
);

const cellCreator = {
  [NAME]: ProviderLink,
  [READY]: StatusCell,
  [URL]: TextCell,
  [TYPE]: TextCell,
  [NAMESPACE]: ({ value }: CellProps) => (
    <ResourceLink kind="Namespace" name={value} />
  ),
};

const ProviderRow = (kind: string) =>
  function ProviderRow({ columns, resource }: RowProps<ProviderResource>) {
    const { t } = useTranslation();

    return (
      <Tr>
        {columns.map(({ id, tKey, toValue }) => (
          <Td key={id} dataLabel={t(tKey)}>
            {cellCreator?.[id]?.({
              kind,
              t,
              value: toValue(resource),
              resource,
            }) ?? null}
          </Td>
        ))}
      </Tr>
    );
  };

export default ProviderRow;
