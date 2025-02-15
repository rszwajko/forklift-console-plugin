import React from 'react';
import { Link } from 'react-router-dom';
import { getResourceUrl } from 'src/modules/Providers/utils';
import { useForkliftTranslation } from 'src/utils/i18n';

import { PlanModelRef } from '@kubev2v/types';
import { Split, SplitItem } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons';

import { CellProps } from './CellProps';

export const VMsCell: React.FC<CellProps> = ({ data }) => {
  const { t } = useForkliftTranslation();

  const specVms = data?.obj?.spec?.vms;

  const planURL = getResourceUrl({
    reference: PlanModelRef,
    name: data?.obj?.metadata?.name,
    namespace: data?.obj?.metadata?.namespace,
  });

  return (
    <Link to={`${planURL}`}>
      <Split>
        <SplitItem className="forklift-overview__controller-card__status-icon">
          <VirtualMachineIcon />
        </SplitItem>
        <SplitItem>{t('{{total}} VMs', { total: specVms?.length })}</SplitItem>
      </Split>
    </Link>
  );
};
