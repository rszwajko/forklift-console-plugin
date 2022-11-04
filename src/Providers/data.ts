import { useMemo } from 'react';
import { ProviderResource } from 'src/internal/k8s';
import {
  API_VERSION,
  CONNECTED,
  DEFAULT_TRANSFER_NETWORK,
  DEFAULT_TRANSFER_NETWORK_ANNOTATION,
  INVENTORY,
  KIND,
  NAME,
  NAMESPACE,
  READY,
  SECRET_NAME,
  TYPE,
  UID,
  URL,
  VALIDATED,
} from 'src/utils/constants';
import { useProviders } from 'src/utils/fetch';

import { useInventoryProvidersQuery } from '@app/queries';
import {
  IOpenShiftProvider,
  IProvidersByType,
  IRHVProvider,
  IVMwareProvider,
} from '@app/queries/types';

const conditionState = (state: string) =>
  state === 'True' || state === 'False' ? state : 'Unknown';

interface Condition {
  status: string;
  message: string;
}
interface SupportedConditions {
  Ready?: Condition;
  Validated?: Condition;
  ConnectionTested?: Condition;
  InventoryCreated?: Condition;
}

interface FlattenedProvider {
  [KIND]: string;
  [NAME]: string;
  [NAMESPACE]: string;
  [URL]: string;
  [TYPE]: string;
  [UID]: string;
  [SECRET_NAME]: string;
  [API_VERSION]: string;
  [DEFAULT_TRANSFER_NETWORK]: string;
}

interface FlattenedConditions {
  [READY]: string;
  conditions: {
    [READY]: Condition;
    [CONNECTED]: Condition;
    [VALIDATED]: Condition;
    [INVENTORY]: Condition;
  };
}

interface MergedInventory {
  clusterCount: number;
  hostCount: number;
  vmCount: number;
  networkCount: number;
  storageCount: number;
}

export type MergedProvider = FlattenedProvider & MergedInventory & FlattenedConditions;

const mergeData = (resources: ProviderResource[], inventory: IProvidersByType) =>
  resources
    .map(
      ({
        metadata: { name, namespace, uid, annotations } = {},
        status: { conditions = [] } = {},
        spec: { url, type, secret: { name: secretName } = {} } = {},
        kind,
        apiVersion,
      }): [
        FlattenedProvider,
        IVMwareProvider & IRHVProvider & IOpenShiftProvider,
        SupportedConditions,
      ] => [
        {
          name,
          namespace,
          url,
          type,
          uid,
          kind,
          secretName,
          apiVersion,
          defaultTransferNetwork: annotations?.[DEFAULT_TRANSFER_NETWORK_ANNOTATION],
        },
        inventory?.[type].find(({ uid: otherUid }) => otherUid === uid) ?? {},
        Object.fromEntries(
          conditions.map(({ type, status, message }) => [
            type,
            { status: conditionState(status), message },
          ]),
        ),
      ],
    )
    .map(
      ([
        provider,
        { clusterCount, hostCount, vmCount, networkCount, datastoreCount, storageDomainCount },
        { Ready, Validated, ConnectionTested, InventoryCreated },
      ]): MergedProvider => ({
        ...provider,
        clusterCount,
        hostCount,
        vmCount,
        networkCount,
        storageCount: storageDomainCount ?? datastoreCount,
        ready: Ready?.status ?? 'Unknown',
        conditions: {
          ready: Ready,
          inventory: InventoryCreated,
          validated: Validated,
          connected: ConnectionTested,
        },
      }),
    );

export const useProvidersWithInventory = ({
  kind,
  namespace,
  name = undefined,
}): [MergedProvider[], boolean, boolean] => {
  const [resources, loaded, error] = useProviders({ kind, namespace, name });
  const { data, isSuccess, isError } = useInventoryProvidersQuery();
  const providersWithInventory = useMemo(
    () => (resources && data ? mergeData(resources, data) : []),
    [resources, data],
  );

  const totalSuccess = loaded && isSuccess;
  const totalError = error || isError;
  // extra memo to keep the tuple reference stable
  // the tuple is used as data source and passed as prop
  // which triggres unnecessary re-renders
  return useMemo(
    () => [providersWithInventory, totalSuccess, totalError],
    [providersWithInventory, totalSuccess, totalError],
  );
};
