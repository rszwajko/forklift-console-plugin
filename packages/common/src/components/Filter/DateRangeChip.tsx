import React from 'react';

import { Flex, FlexItem } from '@patternfly/react-core';

export interface DateRangeChipProps {
  // ISO time interval
  interval: string;
  fromLabel: string;
  toLabel: string;
}

export const DateRangeChip = ({ interval, fromLabel, toLabel }: DateRangeChipProps) => {
  const [from, to] = interval?.split('/') ?? '';
  return (
    <Flex direction={{ default: 'row' }}>
      <Flex
        direction={{ default: 'column' }}
        spaceItems={{
          default: 'spaceItemsNone',
        }}
      >
        <FlexItem>
          <b>{fromLabel}</b>
        </FlexItem>
        <FlexItem>
          <b>{toLabel}</b>
        </FlexItem>
      </Flex>
      <Flex
        direction={{ default: 'column' }}
        spaceItems={{
          default: 'spaceItemsNone',
        }}
      >
        <FlexItem>{from}</FlexItem>
        <FlexItem>{to}</FlexItem>
      </Flex>
    </Flex>
  );
};
