import React, { FC } from 'react';
import { useModal } from 'src/modules/Providers/modals';
import { useForkliftTranslation } from 'src/utils/i18n';

import { V1beta1Provider } from '@kubev2v/types';
import { Button, Modal, ToolbarItem } from '@patternfly/react-core';

import { MigrationWizard, MigrationWizardProps } from './MigrationWizard';

export const MigrationAction: FC<{
  selectedIds: string[];
  provider: V1beta1Provider;
}> = ({ selectedIds, provider }) => {
  const { t } = useForkliftTranslation();
  const { showModal } = useModal();
  return (
    <ToolbarItem>
      <Button
        variant="secondary"
        onClick={() =>
          showModal(<MigrationWizardModal provider={provider} selectedIds={selectedIds} />)
        }
        isDisabled={!selectedIds?.length}
      >
        {t('Migrate')}
      </Button>
    </ToolbarItem>
  );
};

const MigrationWizardModal: FC<MigrationWizardProps> = (props) => {
  const { t } = useForkliftTranslation();
  return (
    <Modal title={t('Migration Wizard')} isOpen={true}>
      <MigrationWizard {...props} />
    </Modal>
  );
};
