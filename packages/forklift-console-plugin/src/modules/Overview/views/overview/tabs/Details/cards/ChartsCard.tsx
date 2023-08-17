import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { useForkliftTranslation } from 'src/utils/i18n';

import { MigrationModelGroupVersionKind, V1beta1Migration } from '@kubev2v/types';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Chart, ChartAxis, ChartBar, ChartGroup, ChartTooltip } from '@patternfly/react-charts';
import {
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  Flex,
  KebabToggle,
} from '@patternfly/react-core';

import { MigrationsCardProps } from './MigrationsCard';

interface MigrationDataPoint {
  dateLabel: string;
  value: number;
}

const toStarted = (m: V1beta1Migration): string => m.status.started;
const toFinished = (m: V1beta1Migration): string => m.status.completed;
const hasTimestamp = (timestamp: string) => timestamp && DateTime.fromISO(timestamp).isValid;
const toDateTime = (timestamp: string): DateTime => DateTime.fromISO(timestamp);
const isLast7Days = (date: DateTime) => date.diffNow('days').get('days') <= 7;
const isLast24H = (date: DateTime) => date.diffNow('hours').get('hours') <= 24;
const toDayLabel = (date: DateTime): string => date.toFormat('LLL dd');
const toHourLabel = (date: DateTime): string => date.toFormat('HH');
const groupByLabel = (acc: { [key: string]: number }, label: string) => ({
  ...acc,
  [label]: (acc[label] || 0) + 1,
});
const toDataPoints = (
  allMigrations: V1beta1Migration[],
  toTimestamp: (m: V1beta1Migration) => string,
  isDaysViewSelected: boolean,
): MigrationDataPoint[] =>
  Object.entries(
    allMigrations
      .map(toTimestamp)
      .filter(hasTimestamp)
      .map(toDateTime)
      .filter(isDaysViewSelected ? isLast7Days : isLast24H)
      .map(isDaysViewSelected ? toDayLabel : toHourLabel)
      // assume that each time point has unique label
      // if time window is longer then 24h or 28 days then extra ID is needed
      .reduce(groupByLabel, {}),
  ).map(([dateLabel, value]) => ({ dateLabel, value }));

export const ChartsCard: React.FC<MigrationsCardProps> = () => {
  const { t } = useForkliftTranslation();
  const [isDropdownOpened, setIsDropdownOpened] = useState(false);
  const onToggle = () => setIsDropdownOpened(!isDropdownOpened);
  const [isDaysViewSelected, setIsDaysViewSelected] = useState(true);
  const [allMigrations] = useK8sWatchResource<V1beta1Migration[]>({
    groupVersionKind: MigrationModelGroupVersionKind,
    namespaced: true,
    isList: true,
  });
  const migrations: {
    started: MigrationDataPoint[];
    failed: MigrationDataPoint[];
    finished: MigrationDataPoint[];
  } = {
    started: toDataPoints(allMigrations, toStarted, isDaysViewSelected),
    finished: toDataPoints(allMigrations, toFinished, isDaysViewSelected),
    failed: toDataPoints(
      allMigrations.filter((m) => m?.status?.conditions?.find((it) => it?.type === 'Failed')),
      toFinished,
      isDaysViewSelected,
    ),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Last Migrations')}</CardTitle>
        <CardActions>
          <Dropdown
            toggle={<KebabToggle onToggle={onToggle} />}
            isOpen={isDropdownOpened}
            isPlain
            dropdownItems={[
              <DropdownItem
                onClick={() => {
                  onToggle();
                  setIsDaysViewSelected(true);
                }}
                key="7days"
              >
                {t('7 days')}
              </DropdownItem>,
              <DropdownItem
                onClick={() => {
                  onToggle();
                  setIsDaysViewSelected(false);
                }}
                key="24hours"
              >
                {t('24 hours')}
              </DropdownItem>,
            ]}
          />
        </CardActions>
      </CardHeader>
      <CardBody className="forklift-status-migration">
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <Chart
            ariaDesc="Bar chart with migration statistics"
            domainPadding={{ x: [30, 25] }}
            legendData={[{ name: t('Started') }, { name: t('Finished') }, { name: t('Failed') }]}
            legendPosition="bottom-left"
            height={400}
            width={450}
            padding={{
              bottom: 75,
              left: 100,
              right: 100,
              top: 50,
            }}
          >
            <ChartAxis />
            <ChartAxis dependentAxis showGrid />
            <ChartGroup offset={11} horizontal>
              <ChartBar
                data={migrations.started.map(({ dateLabel, value }) => ({
                  x: dateLabel,
                  y: value,
                  name: t('Started'),
                  label: t('{{dateLabel}} Started: {{value}}', { dateLabel, value }),
                }))}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
              <ChartBar
                data={migrations.finished.map(({ dateLabel, value }) => ({
                  x: dateLabel,
                  y: value,
                  name: 'Finished',
                  label: t('{{dateLabel}} Finished: {{value}}', { dateLabel, value }),
                }))}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
              <ChartBar
                data={migrations.failed.map(({ dateLabel, value }) => ({
                  x: dateLabel,
                  y: value,
                  name: t('Failed'),
                  label: t('{{dateLabel}} Failed: {{value}}', { dateLabel, value }),
                }))}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
            </ChartGroup>
          </Chart>
        </Flex>
      </CardBody>
    </Card>
  );
};
