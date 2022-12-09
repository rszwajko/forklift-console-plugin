import { useMemo } from 'react';
import * as C from '_/utils/constants';
import { useMigrations, usePlans } from '_/utils/fetch';
import { groupVersionKindForObj } from '_/utils/resources';
import { MigrationResource, PlanResource } from '_/utils/types';

import { PlanState } from '@app/common/constants';
import { getPlanState } from '@app/Plans/components/helpers';
import { findLatestMigration } from '@app/queries';
import { IPlan, PlanType } from '@app/queries/types';
import { K8sGroupVersionKind } from '@openshift-console/dynamic-plugin-sdk';
export interface FlatPlan {
  //plan.metadata.name
  [C.NAME]: string;
  [C.NAMESPACE]: string;
  [C.GVK]: K8sGroupVersionKind;
  // plan.spec.description
  [C.DESCRIPTION]: string;
  // plan.spec.warm
  [C.TYPE]: PlanType;
  // plan.spec.provider.source.name
  [C.SOURCE]: string;
  [C.SOURCE_GVK]: K8sGroupVersionKind;
  //plan.spec.provider.destination.name
  [C.TARGET]: string;
  [C.TARGET_GVK]: K8sGroupVersionKind;
  [C.STATUS]: PlanState;
  // plan.spec.vms.length
  [C.VM_COUNT]: number;
  // TODO: missing in yaml, present in IPlan
  // TODO: similar param in IMigration
  // plan.spec.cutover
  //cutover?: string;
  [C.VM_DONE]: number;
}

const mergeData = (plans: PlanResource[], migrations: MigrationResource[]): FlatPlan[] =>
  plans
    .map((plan): [IPlan, PlanState, K8sGroupVersionKind] => {
      const latestMigration = findLatestMigration(plan, migrations);
      return [plan, getPlanState(plan, latestMigration, migrations), groupVersionKindForObj(plan)];
    })
    .map(
      ([
        {
          metadata: { name, namespace },
          spec: {
            description,
            warm,
            provider: { source, destination },
            vms,
          },
          status: { migration },
        },
        planState,
        gvk,
      ]): FlatPlan => ({
        name,
        namespace,
        gvk,
        description,
        source: source.name,
        sourceGvk: groupVersionKindForObj(source),
        target: destination.name,
        targetGvk: groupVersionKindForObj(destination),
        type: warm ? 'Warm' : 'Cold',
        status: planState,
        vmCount: vms?.length || 0,
        vmDone:
          migration?.vms?.filter(
            (vm) =>
              !!vm.completed &&
              !vm.error &&
              !vm.conditions?.find((condition) => condition.type === 'Canceled'),
          ).length || 0,
      }),
    );

export const useFLatPlans = ({
  kind,
  namespace,
  name = undefined,
}): [FlatPlan[], boolean, boolean] => {
  const [plans, pLoaded, pError] = usePlans({ kind, namespace, name });
  const [migrations, mLoaded, mError] = useMigrations({ kind, namespace });

  const merged = useMemo(
    () => (plans && migrations ? mergeData(plans, migrations) : []),
    [plans, migrations],
  );

  const totalSuccess = pLoaded && mLoaded;
  const totalError = pError || mError;

  // extra memo to keep the tuple reference stable
  // the tuple is used as data source and passed as prop
  // which triggres unnecessary re-renders
  return useMemo(() => [merged, totalSuccess, totalError], [merged, totalSuccess, totalError]);
};
