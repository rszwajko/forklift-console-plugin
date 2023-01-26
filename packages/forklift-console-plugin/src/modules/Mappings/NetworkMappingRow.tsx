import React, { useState } from 'react';
import { RowProps } from 'common/src/components/TableView';
import { MappingDetailView } from 'legacy/src/Mappings/components/MappingDetailView';
import { IdOrNameRef, MappingType } from 'legacy/src/queries/types';
import * as C from 'src/utils/constants';
import { useTranslation } from 'src/utils/i18n';

import { K8sGroupVersionKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Label, LabelGroup, LabelProps } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { ExpandableRowContent, Td, Tr } from '@patternfly/react-table';

import { FlatNetworkMapping, Network } from './data';
interface CellProps {
  value: string;
  entity: FlatNetworkMapping;
  currentNamespace: string;
  t: (key: string) => string;
}

const TextCell = ({ value }: CellProps) => <>{value ?? ''}</>;

const Actions = ({ entity, currentNamespace }: CellProps) => <></>;
Actions.displayName = 'Actions';

const colors: LabelProps['color'][] = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey'];

const Networks = ({
  sourceNetworks,
  color,
}: {
  sourceNetworks: IdOrNameRef[];
  color: LabelProps['color'];
}) => (
  <>
    {sourceNetworks
      .map(({ id, name }) => name || id || '')
      .map((nameOrId) => (
        <>
          <Label key={nameOrId} color={color}>
            {nameOrId}
          </Label>{' '}
        </>
      ))}
  </>
);

const SourceNetworksCell = ({ t, entity }: CellProps) => {
  const singleGroup = entity.from.length === 1;
  return (
    <>
      {singleGroup && <Networks sourceNetworks={entity.from[0][1]} color={colors[0]} />}
      {!singleGroup && (
        <>
          {entity.from.map(([target, sourceNetworks], index) => (
            <LabelGroup key={networkName(target, t)} categoryName={networkName(target, t)}>
              <Networks sourceNetworks={sourceNetworks} color={colors[index % colors.length]} />
            </LabelGroup>
          ))}
        </>
      )}
    </>
  );
};

const networkName = (n: Network, t: (k: string) => string) =>
  n.type === 'pod' ? t('Pod network') : `${n.namespace}/${n.name}`;

const TargetNetworksCell = ({ t, entity }: CellProps) => (
  <>
    {entity.to.map((n, index) => {
      return (
        <Label key={networkName(n, t)} color={colors[index % colors.length]}>
          {networkName(n, t)}
        </Label>
      );
    })}
  </>
);

const Ref = ({
  gvk,
  name,
  namespace,
}: {
  gvk: K8sGroupVersionKind;
  name: string;
  namespace: string;
}) => <ResourceLink groupVersionKind={gvk} name={name} namespace={namespace} />;

const cellCreator: Record<string, (props: CellProps) => JSX.Element> = {
  [C.SOURCE]: ({ entity: e }: CellProps) => (
    <Ref gvk={e.sourceGvk} name={e.source} namespace={e.namespace} />
  ),
  [C.TARGET]: ({ entity: e }: CellProps) => (
    <Ref gvk={e.targetGvk} name={e.target} namespace={e.namespace} />
  ),
  [C.NAMESPACE]: ({ value }: CellProps) => <ResourceLink kind="Namespace" name={value} />,
  [C.ACTIONS]: Actions,
  [C.FROM]: SourceNetworksCell,
  [C.TO]: TargetNetworksCell,
};

const NetworkMappingRow = ({ columns, entity, currentNamespace }: RowProps<FlatNetworkMapping>) => {
  const { t } = useTranslation();
  const [isRowExpanded, setiIsRowExpanded] = useState(false);
  return (
    <>
      <Tr>
        {columns.map(({ id, toLabel }) => {
          const Cell = cellCreator[id] ?? TextCell;
          return (
            <Td
              key={id}
              dataLabel={toLabel(t)}
              compoundExpand={
                id === C.FROM || id === C.TO
                  ? { isExpanded: isRowExpanded, onToggle: () => setiIsRowExpanded(!isRowExpanded) }
                  : undefined
              }
            >
              <Cell
                value={String(entity[id] ?? '')}
                entity={entity}
                t={t}
                currentNamespace={currentNamespace}
              />
            </Td>
          );
        })}
      </Tr>
      {isRowExpanded ? (
        <Tr isExpanded={isRowExpanded}>
          <Td dataLabel="MappingGraph" noPadding colSpan={columns.length}>
            <ExpandableRowContent>
              <MappingDetailView
                mappingType={MappingType.Network}
                // sourceProviderType={sourceProviderObj?.spec.type || 'vsphere'}
                sourceProviderType={'vsphere'}
                mapping={entity.object}
                className={spacing.mLg}
              />
            </ExpandableRowContent>
          </Td>
        </Tr>
      ) : null}
    </>
  );
};

export default NetworkMappingRow;
