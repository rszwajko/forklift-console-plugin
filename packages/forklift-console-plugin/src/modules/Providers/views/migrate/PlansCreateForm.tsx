import React from 'react';
import { useForkliftTranslation } from 'src/utils/i18n';

import { ProviderModelGroupVersionKind } from '@kubev2v/types';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Divider,
  Form,
  FormGroup,
  List,
  ListItem,
  Panel,
  PanelMain,
  PanelMainBody,
  TextInput,
} from '@patternfly/react-core';

import { PageAction, setPlanDescription, setPlanName, setPlanTargetNamespace } from './actions';
import { CreateVmMigrationPageState } from './reducer';

export const PlansCreateForm = ({
  state: { newPlan: plan, validation },
  dispatch,
}: {
  state: CreateVmMigrationPageState;
  dispatch: (action: PageAction<unknown, unknown>) => void;
}) => {
  const { t } = useForkliftTranslation();
  return (
    <Form isWidthLimited className="forklift-section-secret-edit">
      <FormGroup label={t('Plan name')} isRequired fieldId="planName" validated={validation.name}>
        <TextInput
          isRequired
          type="text"
          id="planName"
          value={plan?.metadata?.name}
          validated={validation.name}
          onChange={(value) => dispatch(setPlanName(value?.trim() ?? '', []))}
        />
      </FormGroup>
      <FormGroup label={t('Description')} fieldId="description">
        <TextInput
          type="text"
          id="description"
          value={plan?.spec?.description}
          onChange={(value) => dispatch(setPlanDescription(value))}
        />
      </FormGroup>
      <Divider />
      <FormGroup label={t('Source provider')} fieldId="sourceProvider">
        <span id="sourceProvider">
          <ResourceLink
            name={plan?.spec?.provider?.source?.name}
            namespace={plan?.spec?.provider?.source?.namespace}
            groupVersionKind={ProviderModelGroupVersionKind}
          />
        </span>
      </FormGroup>
      <FormGroup label={t('Selected VMs')} fieldId="selectedVms">
        <Panel isScrollable>
          <PanelMain>
            <PanelMainBody>
              <List>
                {plan.spec.vms
                  .map(({ id, name }, index) => name ?? id ?? index)
                  .map((value) => (
                    <ListItem key={value}>{value}</ListItem>
                  ))}
              </List>
            </PanelMainBody>
          </PanelMain>
        </Panel>
      </FormGroup>
      <Divider />
      <FormGroup label={t('Target provider')} fieldId="targetProvider">
        <TextInput
          type="text"
          id="targetProvider"
          value={plan?.spec?.provider?.destination?.name}
        />
      </FormGroup>
      <FormGroup
        label={t('Target namespace')}
        fieldId="targetNamespace"
        isRequired
        validated={validation.targetNamespace}
      >
        <TextInput
          type="text"
          isRequired
          validated={validation.targetNamespace}
          id="targetNamespace"
          value={plan?.spec?.targetNamespace}
          onChange={(value) => dispatch(setPlanTargetNamespace(value))}
        />
      </FormGroup>
      <Divider />
    </Form>
  );
};
