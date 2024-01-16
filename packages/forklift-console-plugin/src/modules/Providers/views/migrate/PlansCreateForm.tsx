import React, { useState } from 'react';
import { useForkliftTranslation } from 'src/utils/i18n';

import { DefaultHeader, TableView, useSort } from '@kubev2v/common';
import { ProviderModelGroupVersionKind } from '@kubev2v/types';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Form,
  FormGroup,
  TextInput,
} from '@patternfly/react-core';

import { DetailsItem } from '../../utils';
import { VmData } from '../details';

import { PageAction, setPlanName } from './actions';
import { CreateVmMigrationPageState } from './reducer';

export const PlansCreateForm = ({
  state: {
    newPlan: plan,
    validation,
    selectedVms,
    vmFieldsFactory: [vmFieldsFactory, RowMapper],
  },
  dispatch,
}: {
  state: CreateVmMigrationPageState;
  dispatch: (action: PageAction<unknown, unknown>) => void;
}) => {
  const { t } = useForkliftTranslation();
  const vmFields = vmFieldsFactory(t);
  const [activeSort, setActiveSort, compareFn] = useSort(vmFields);
  const sortedVms = [...selectedVms].sort(compareFn);
  const [isNameEdited, setIsNameEdited] = useState(false);
  const [isVmDetails, setIsVmDetails] = useState(false);
  return (
    <Drawer isExpanded={isVmDetails}>
      <DrawerContent
        panelContent={
          <DrawerPanelContent widths={{ default: 'width_75' }}>
            <DrawerHead>
              <DrawerActions>
                <DrawerCloseButton onClick={() => setIsVmDetails(false)} />
              </DrawerActions>
            </DrawerHead>
            <TableView<VmData>
              entities={sortedVms}
              visibleColumns={vmFields}
              aria-label={t('Selected VMs')}
              Row={RowMapper}
              Header={DefaultHeader}
              activeSort={activeSort}
              setActiveSort={setActiveSort}
              currentNamespace={plan.spec.provider?.source?.namespace}
            />
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody>
          <DescriptionList
            className="forklift-create-provider-edit-section"
            columnModifier={{
              default: '1Col',
            }}
          >
            {isNameEdited ? (
              <Form>
                <FormGroup
                  label={t('Plan name')}
                  isRequired
                  fieldId="planName"
                  validated={validation.name}
                >
                  <TextInput
                    isRequired
                    type="text"
                    id="planName"
                    value={plan.metadata.name}
                    validated={validation.name}
                    onChange={(value) => dispatch(setPlanName(value?.trim() ?? ''))}
                  />
                </FormGroup>
              </Form>
            ) : (
              <DetailsItem
                title={t('Plan name')}
                content={plan.metadata.name}
                onEdit={() => setIsNameEdited(true)}
              />
            )}
            <DetailsItem
              title={t('Source provider')}
              content={
                <ResourceLink
                  name={plan.spec.provider?.source?.name}
                  namespace={plan.spec.provider?.source?.namespace}
                  groupVersionKind={ProviderModelGroupVersionKind}
                />
              }
            />
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Selected VMs')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Button onClick={() => setIsVmDetails(true)} variant="link" isInline>
                  {t('{{vmCount}} VMs selected ', { vmCount: plan.spec.vms?.length ?? 0 })}
                </Button>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
