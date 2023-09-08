import React from 'react';
import { TableIconCell } from 'src/modules/Providers/utils';
import { useForkliftTranslation } from 'src/utils/i18n';

import { Tooltip } from '@patternfly/react-core';
import { OffIcon, PowerOffIcon, UnknownIcon } from '@patternfly/react-icons';

import { getVmPowerState } from '../utils';

import { VMCellProps } from './VMCellProps';

export const PowerStateCellRenderer: React.FC<VMCellProps> = ({ data, providerType }) => {
  const powerState = getVmPowerState(providerType, data?.vm);
  const { t } = useForkliftTranslation();
  const [icon, tooltipText, shortText] =
    powerState === 'on'
      ? [<PowerOffIcon color="green" key="on" />, t('Powered on'), t('On')]
      : powerState === 'off'
      ? [<OffIcon color="red" key="off" />, t('Powered off'), t('Off')]
      : [<UnknownIcon key="unknown" />, t('Unknown power state'), t('Unknown')];

  return (
    <TableIconCell icon={<Tooltip content={tooltipText}>{icon}</Tooltip>}>
      {shortText}
    </TableIconCell>
  );
};
