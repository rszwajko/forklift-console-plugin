import React, { FC, useEffect, useRef } from 'react';
import { useHistory } from 'react-router';
import { produce } from 'immer';
import SectionHeading from 'src/components/headers/SectionHeading';
import { useForkliftTranslation } from 'src/utils/i18n';
import { useImmerReducer } from 'use-immer';

import {
  NetworkMapModel,
  NetworkMapModelGroupVersionKind,
  PlanModel,
  PlanModelGroupVersionKind,
  PlanModelRef,
  ProviderModelGroupVersionKind,
  ProviderModelRef,
  StorageMapModel,
  V1beta1NetworkMap,
  V1beta1Plan,
  V1beta1Provider,
  V1beta1StorageMap,
} from '@kubev2v/types';
import {
  k8sCreate,
  K8sModel,
  k8sPatch,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert, Button, Flex, FlexItem, PageSection } from '@patternfly/react-core';

import { useToggle } from '../../hooks';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useOpenShiftNetworks, useSourceNetworks } from '../../hooks/useNetworks';
import { useNicProfiles } from '../../hooks/useNicProfiles';
import { getResourceUrl } from '../../utils';

import {
  setAvailableProviders,
  setAvailableSourceNetworks,
  setAvailableTargetNamespaces,
  setAvailableTargetNetworks,
  setError,
  setExistingNetMaps,
  setExistingPlans,
  setNicProfiles,
  startCreate,
} from './actions';
import { PlansCreateForm } from './PlansCreateForm';
import { useCreateVmMigrationData } from './ProvidersCreateVmMigrationContext';
import { reducer } from './reducer';
import { createInitialState, getObjectRef } from './stateHelpers';

const ProvidersCreateVmMigrationPage: FC<{
  namespace: string;
}> = ({ namespace }) => {
  const { t } = useForkliftTranslation();
  const history = useHistory();

  const { data: { selectedVms = [], provider: sourceProvider = undefined } = {} } =
    useCreateVmMigrationData();
  // error state - the page was entered directly without choosing the VMs
  const emptyContext = !selectedVms?.length || !sourceProvider;
  // error recovery - redirect to provider list
  useEffect(() => {
    if (emptyContext) {
      history.push(
        getResourceUrl({
          reference: ProviderModelRef,
          namespace: namespace,
        }),
      );
    }
  }, [emptyContext]);

  const [state, dispatch] = useImmerReducer(
    reducer,
    { namespace, sourceProvider, selectedVms },
    createInitialState,
  );
  const {
    workArea: { targetProvider },
  } = state;

  const [providers, providersLoaded, providerError] = useK8sWatchResource<V1beta1Provider[]>({
    groupVersionKind: ProviderModelGroupVersionKind,
    namespaced: true,
    isList: true,
    namespace,
  });
  useEffect(
    () => dispatch(setAvailableProviders(providers, providersLoaded, providerError)),
    [providers],
  );

  const [plans, plansLoaded, plansError] = useK8sWatchResource<V1beta1Plan[]>({
    groupVersionKind: PlanModelGroupVersionKind,
    namespaced: true,
    isList: true,
    namespace,
  });
  useEffect(
    () => dispatch(setExistingPlans(plans, plansLoaded, plansError)),
    [plans, plansLoaded, plansError],
  );

  const [netMaps, netMapsLoaded, netMapsError] = useK8sWatchResource<V1beta1NetworkMap[]>({
    groupVersionKind: NetworkMapModelGroupVersionKind,
    namespaced: true,
    isList: true,
    namespace,
  });
  useEffect(
    () => dispatch(setExistingNetMaps(netMaps, netMapsLoaded, netMapsError)),
    [netMaps, netMapsLoaded, netMapsError],
  );

  const [namespaces, nsLoading, nsError] = useNamespaces(targetProvider);
  useEffect(
    () => dispatch(setAvailableTargetNamespaces(namespaces, nsLoading, nsError)),
    [namespaces, nsLoading, nsError],
  );

  const [targetNetworks, targetNetworksLoading, targetNetworksError] =
    useOpenShiftNetworks(targetProvider);
  useEffect(
    () =>
      dispatch(
        setAvailableTargetNetworks(targetNetworks, targetNetworksLoading, targetNetworksError),
      ),
    [targetNetworks, targetNetworksLoading, targetNetworksError],
  );

  const [sourceNetworks, sourceNetworksLoading, sourceNetworksError] =
    useSourceNetworks(sourceProvider);
  useEffect(
    () =>
      dispatch(
        setAvailableSourceNetworks(sourceNetworks, sourceNetworksLoading, sourceNetworksError),
      ),
    [sourceNetworks, sourceNetworksLoading, sourceNetworksError],
  );

  const [nicProfiles, nicProfilesLoading, nicProfilesError] = useNicProfiles(sourceProvider);
  useEffect(
    () => dispatch(setNicProfiles(nicProfiles, nicProfilesLoading, nicProfilesError)),
    [nicProfiles, nicProfilesLoading, nicProfilesError],
  );

  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  useEffect(() => {
    const {
      flow,
      underConstruction: { plan, netMap, storageMap },
    } = state;
    if (!flow.editingDone || !mounted.current) {
      return;
    }

    const createStorage = async (storageMap: V1beta1StorageMap) => {
      return await k8sCreate({
        model: StorageMapModel,
        data: storageMap,
      });
    };
    const createNetwork = async (netMap: V1beta1NetworkMap) => {
      return await k8sCreate({
        model: NetworkMapModel,
        data: netMap,
      });
    };

    const createPlan = async (
      plan: V1beta1Plan,
      netMap: V1beta1NetworkMap,
      storageMap: V1beta1StorageMap,
    ) => {
      const created = await k8sCreate({
        model: PlanModel,
        data: plan,
      });
      return [created, netMap, storageMap];
    };

    const addOwnerRef = async (model: K8sModel, resource, ownerReferences) => {
      return await k8sPatch({
        model,
        resource,
        data: [
          {
            op: 'add',
            path: '/metadata/ownerReferences',
            value: ownerReferences,
          },
        ],
      });
    };

    Promise.all([createStorage(storageMap), createNetwork(netMap)])
      .then(([storageMap, netMap]) => {
        return createPlan(
          produce(plan, (draft) => {
            draft.spec.map.network = getObjectRef(netMap);
            draft.spec.map.storage = getObjectRef(storageMap);
          }),
          netMap,
          storageMap,
        );
      })
      .then(([createdPlan, netMap, storageMap]) => {
        const ownerReferences = [getObjectRef(createdPlan)];
        return Promise.all([
          addOwnerRef(StorageMapModel, storageMap, ownerReferences),
          addOwnerRef(NetworkMapModel, netMap, ownerReferences),
        ]);
      })
      .then(
        () =>
          mounted.current &&
          history.push(
            getResourceUrl({
              reference: PlanModelRef,
              namespace,
              name: plan.metadata.name,
            }),
          ),
      )
      .catch((error) => {
        mounted.current && dispatch(setError(error));
      });
  }, [state.flow.editingDone, state.underConstruction.storageMap]);

  const [isLoading, toggleIsLoading] = useToggle();
  const onUpdate = toggleIsLoading;

  if (emptyContext) {
    // display empty node and wait for redirect triggered from useEffect
    // the redirect should be triggered right after the first render()
    // so any "empty page" would only "blink"
    return <></>;
  }

  return (
    <PageSection variant="light">
      <SectionHeading text={t('Create Plan')} />

      <PlansCreateForm state={state} dispatch={dispatch} />
      {state.flow.apiError && (
        <Alert
          className="co-alert co-alert--margin-top"
          isInline
          variant="danger"
          title={t('Error')}
        >
          {state.flow.apiError.message || state.flow.apiError.toString()}
        </Alert>
      )}
      <Flex>
        <FlexItem>
          <Button
            variant="primary"
            isDisabled={Object.values(state.validation).some(
              (validation) => validation === 'error',
            )}
            isLoading={isLoading}
            onClick={() => dispatch(startCreate())}
          >
            {t('Create and edit')}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button variant="secondary" onClick={onUpdate} isDisabled={true} isLoading={isLoading}>
            {t('Create and start')}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button onClick={history.goBack} variant="secondary">
            {t('Cancel')}
          </Button>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export default ProvidersCreateVmMigrationPage;
