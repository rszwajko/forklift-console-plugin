import React from 'react';
import { DateTime, Interval } from 'luxon';
import { useForkliftTranslation } from 'src/utils/i18n';

import { Chart, ChartAxis, ChartBar, ChartStack, ChartTooltip } from '@patternfly/react-charts';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { MigrationsCardProps } from './MigrationsCard';

interface MigrationDataPoint {
  dateLabel: string;
  value: number;
}

export const ChartsCard: React.FC<MigrationsCardProps> = () => {
  const { t } = useForkliftTranslation();
  const [isWeekViewSelected, setIsWeekViewSelected] = React.useState(true);

  const mockData = Interval.fromDateTimes(
    DateTime.now().minus(isWeekViewSelected ? { days: 7 } : { hours: 24 }),
    DateTime.now(),
  )
    .splitBy(isWeekViewSelected ? { day: 1 } : { hour: 4 })
    .map((d, index) => ({
      dateLabel: d.start.toFormat(isWeekViewSelected ? 'LLL dd' : 'HH'),
      value: (index % 3) + 1,
    }));
  const migrations: {
    started: MigrationDataPoint[];
    failed: MigrationDataPoint[];
    finished: MigrationDataPoint[];
  } = {
    started: mockData,
    failed: mockData,
    finished: mockData,
  };

  return (
    <Card>
      <CardTitle>{t('Last Migrations')}</CardTitle>
      <CardBody className="forklift-status-migration">
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem align={{ default: 'alignRight' }}>
            <ToggleGroup aria-label="Choose time interval for the chart">
              <ToggleGroupItem
                text={t('7 days')}
                isSelected={isWeekViewSelected}
                onChange={(selected: boolean) => setIsWeekViewSelected(selected)}
              />
              <ToggleGroupItem
                text={t('24 hours')}
                isSelected={!isWeekViewSelected}
                onChange={(selected: boolean) => setIsWeekViewSelected(!selected)}
              />
            </ToggleGroup>
          </FlexItem>

          <Chart
            ariaDesc="Stack Chart with monthly metric data"
            domainPadding={{ x: [30, 25] }}
            legendData={[{ name: 'Started' }, { name: 'Finished' }, { name: 'Failed' }]}
            legendPosition="bottom"
            height={225}
            padding={{
              bottom: 75,
              left: 50,
              right: 50,
              top: 50,
            }}
          >
            <ChartAxis fixLabelOverlap />
            <ChartAxis dependentAxis showGrid />
            <ChartStack domainPadding={{ x: [10, 2] }}>
              <ChartBar
                data={migrations.started.map((m) => ({
                  x: m.dateLabel,
                  y: m.value,
                  name: 'Started',
                  label: `${m.dateLabel} Started: ${m.value}`,
                }))}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
              <ChartBar
                data={migrations.started.map((m) => ({
                  x: m.dateLabel,
                  y: m.value,
                  name: 'Finished',
                  label: `${m.dateLabel} Finished: ${m.value}`,
                }))}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
              <ChartBar
                data={migrations.started.map((m) => ({
                  x: m.dateLabel,
                  y: m.value,
                  name: 'Failed',
                  label: `${m.dateLabel} Failed: ${m.value}`,
                }))}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
            </ChartStack>
          </Chart>
        </Flex>
      </CardBody>
    </Card>
  );
};
