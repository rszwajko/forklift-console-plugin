import React, { FC } from 'react';
import { useForkliftTranslation } from 'src/utils/i18n';

import { V1beta1Provider } from '@kubev2v/types';
import { Wizard, WizardStep } from '@patternfly/react-core/next';

export interface MigrationWizardProps {
  provider: V1beta1Provider;
  selectedIds: string[];
}

export const MigrationWizard: FC<MigrationWizardProps> = () => {
  const { t } = useForkliftTranslation();
  return (
    <Wizard height={400} title={t('Migration Wizard')}>
      <WizardStep name={t('General')} id="general-step">
        General
      </WizardStep>
      <WizardStep name={t('Network mappings')} id="network-mapping-step">
        Network mappings
      </WizardStep>
      <WizardStep name={t('Storage mappings')} id="storage-mapping-step">
        Storage mappings
      </WizardStep>
      <WizardStep name={t('Hooks')} id="hooks-step">
        Hooks
      </WizardStep>
      <WizardStep name={t('Summary')} id="summary-step" footer={{ nextButtonText: t('Finish') }}>
        Review step content
      </WizardStep>
    </Wizard>
  );
};
