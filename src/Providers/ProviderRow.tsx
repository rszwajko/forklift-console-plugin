import React from 'react';
import { RowProps } from 'src/components/TableView';
import { useTranslation } from 'src/internal/i18n';
import { NAME, NAMESPACE, READY, TYPE, URL } from 'src/utils/constants';

import { StatusIcon } from '@migtools/lib-ui';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Popover } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';

import { MergedProvider } from './data';

interface CellProps {
  value: string;
  entity: MergedProvider;
  kind: string;
}
const StatusCell = ({ value, entity: { conditions } }: CellProps) => {
  const { t } = useTranslation();
  const existingConditions = Object.values(conditions).filter(Boolean);
  const toState = (value) =>
    value === 'True' ? 'Ok' : value === 'False' ? 'Error' : 'Unknown';
  return (
    <Popover
      hasAutoWidth
      bodyContent={
        <div>
          {existingConditions.length > 0
            ? existingConditions.map(({ message, status }) => {
                return (
                  <StatusIcon
                    key={message}
                    status={toState(status)}
                    label={message}
                  />
                );
              })
            : 'No information'}
        </div>
      }
    >
      <Button variant="link" isInline aria-label={t(value)}>
        <StatusIcon status={toState(value)} label={t(value)} />
      </Button>
    </Popover>
  );
};

const TextCell = ({ value }: { value: string }) => <>{value}</>;

const ProviderLink = ({ value, entity, kind }: CellProps) => (
  <ResourceLink kind={kind} name={value} namespace={entity?.namespace} />
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
  function ProviderRow({ columns, entity }: RowProps<MergedProvider>) {
    return (
      <Tr>
        {columns.map(({ id }) => (
          <Td key={id} dataLabel="foo">
            {cellCreator?.[id]?.({
              kind,
              value: entity[id],
              entity,
            }) ?? <TextCell value={String(entity[id] ?? '')} />}
          </Td>
        ))}
      </Tr>
    );
  };

export default ProviderRow;
