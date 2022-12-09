import React from 'react';
import * as C from '_/utils/constants';
import { RowProps } from 'src/components/TableView';
import { useTranslation } from 'src/utils/i18n';

import { StatusCondition } from '@app/common/components/StatusCondition';
import { getMigStatusState } from '@app/Plans/components/helpers';
import { PlanNameNavLink as Link } from '@app/Plans/components/PlanStatusNavLink';
import { IStatusCondition } from '@app/queries/types';
import { StatusIcon } from '@migtools/lib-ui';
import { K8sGroupVersionKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Progress, ProgressMeasureLocation } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';

import { FlatPlan } from './data';

import './styles.css';

interface CellProps {
  value: string;
  entity: FlatPlan;
}

const TextCell = ({ value }: CellProps) => <>{value ?? ''}</>;

const StatusCell = ({ entity: { status, type, vmCount, vmDone, name } }: CellProps) => {
  const { t } = useTranslation();
  const isBeingStarted = status === 'Starting';
  const isWarmPlan = type === 'Warm';
  const statusConditions: { conditions?: IStatusCondition[] } = {};
  const { title, variant } = getMigStatusState(status, isWarmPlan);
  console.warn('Status', name, vmCount, vmDone);

  if (status === 'Archiving') {
    return <Link name={name}>{t('Archiving')}</Link>;
  } else if (status === 'Archived') {
    return <Link name={name}>{t('Archived')}</Link>;
  } else if (isBeingStarted && !isWarmPlan) {
    return <Link name={name}>{t('Running - preparing for migration')}</Link>;
  } else if (isBeingStarted && isWarmPlan) {
    return <Link name={name}>{t('Running - preparing for incremental data copies')}</Link>;
  } else if (status === 'Unknown') {
    return <StatusIcon status="Warning" label="Unknown" />;
  } else if (status === 'NotStarted-Ready' || status === 'NotStarted-NotReady') {
    return <StatusCondition status={statusConditions} />;
  } else if (status === 'Copying' || status === 'Copying-CutoverScheduled') {
    return <Link name={name}>{t('Running - performing incremental data copies')}</Link>;
  } else if (status === 'StartingCutover') {
    return <Link name={name}>{t('Running - preparing for cutover')}</Link>;
  } else {
    return (
      <Link name={name} isInline={false}>
        <Progress
          title={title}
          value={vmCount ? (vmDone * 100) / vmCount : 0}
          label={t('{{vmDone}} of {{vmCount}} VMs migrated', { vmDone, vmCount })}
          valueText={t('{{vmDone}} of {{vmCount}} VMs migrated', { vmDone, vmCount })}
          variant={variant}
          measureLocation={ProgressMeasureLocation.top}
        />
      </Link>
    );
  }
};

const Ref = ({ gvk, name }: { gvk: K8sGroupVersionKind; name: string }) => (
  <ResourceLink groupVersionKind={gvk} name={name} />
);

const cellCreator: Record<string, (props: CellProps) => JSX.Element> = {
  [C.NAME]: ({ entity: e }: CellProps) => <Ref gvk={e.gvk} name={e.name} />,
  [C.SOURCE]: ({ entity: e }: CellProps) => <Ref gvk={e.sourceGvk} name={e.source} />,
  [C.TARGET]: ({ entity: e }: CellProps) => <Ref gvk={e.targetGvk} name={e.target} />,
  [C.NAMESPACE]: ({ value }: CellProps) => <ResourceLink kind="Namespace" name={value} />,
  [C.STATUS]: StatusCell,
  [C.ACTIONS]: () => <></>,
};

const PlanRow = ({ columns, entity }: RowProps<FlatPlan>) => {
  const { t } = useTranslation();
  return (
    <Tr>
      {columns.map(({ id, toLabel }) => {
        const Cell = cellCreator[id] ?? TextCell;
        return (
          <Td key={id} dataLabel={toLabel(t)}>
            <Cell value={String(entity[id] ?? '')} entity={entity} />
          </Td>
        );
      })}
    </Tr>
  );
};

export default PlanRow;
