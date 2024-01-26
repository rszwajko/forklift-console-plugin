import React, { FC, useEffect } from 'react';
import { useHistory } from 'react-router';
import SectionHeading from 'src/components/headers/SectionHeading';
import { useForkliftTranslation } from 'src/utils/i18n';
import { useImmerReducer } from 'use-immer';

import {
  PlanModelGroupVersionKind,
  ProviderModelGroupVersionKind,
  ProviderModelRef,
  V1beta1Plan,
  V1beta1Provider,
} from '@kubev2v/types';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, PageSection } from '@patternfly/react-core';

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
  setExistingPlans,
  setNicProfiles,
} from './actions';
import { PlansCreateForm } from './PlansCreateForm';
import { useCreateVmMigrationData } from './ProvidersCreateVmMigrationContext';
import { reducer } from './reducer';
import { createInitialState } from './stateHelpers';

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
    () =>
      dispatch(
        setAvailableProviders(
          Array.isArray(providers) ? providers : [],
          providersLoaded,
          providerError,
        ),
      ),
    [providers],
  );

  const [plans, plansLoaded, plansError] = useK8sWatchResource<V1beta1Plan[]>({
    groupVersionKind: PlanModelGroupVersionKind,
    namespaced: true,
    isList: true,
    namespace,
  });
  useEffect(
    () => dispatch(setExistingPlans(Array.isArray(plans) ? plans : [], plansLoaded, plansError)),
    [plans, plansLoaded, plansError],
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

      <Flex>
        <FlexItem>
          <Button variant="primary" isDisabled={true} isLoading={isLoading}>
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
