import React, { useMemo, useState } from 'react';
import { withActionContext } from '_/components/ActionServiceDropdown';
import withQueryClient from '_/components/QueryClientHoc';
import { useTranslation } from 'src/utils/i18n';

import { ConfirmModal } from '@app/common/components/ConfirmModal';
import { PATH_PREFIX } from '@app/common/constants';
import { MustGatherContext } from '@app/common/context';
import { MigrationConfirmModal } from '@app/Plans/components/MigrationConfirmModal';
import { PlanDetailsModal } from '@app/Plans/components/PlanDetailsModal';
import {
  useArchivePlanMutation,
  useCreateMigrationMutation,
  useDeletePlanMutation,
  useSetCutoverMutation,
} from '@app/queries';
import { IPlan } from '@app/queries/types';
import { useModal } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Modal, Text, TextContent } from '@patternfly/react-core';

import { type FlatPlan } from './data';

const editingDisabledTooltip = ({
  t,
  isPlanGathering,
  areProvidersReady,
  isPlanStarted,
  isPlanArchived,
}) => {
  const duplicateMessageOnDisabledEdit = t(
    'To make changes to the plan, select Duplicate and edit the duplicate plan.',
  );
  if (isPlanGathering) {
    return `${t(
      'This plan cannot be edited because it is running must gather.',
    )} ${duplicateMessageOnDisabledEdit}`;
  } else if (isPlanArchived) {
    return `${t(
      'This plan cannot be edited because it has been archived.',
    )} ${duplicateMessageOnDisabledEdit}`;
  } else if (isPlanStarted) {
    return `${t(
      'This plan cannot be edited because it has been started.',
    )} ${duplicateMessageOnDisabledEdit}`;
  } else if (!areProvidersReady) {
    return t(
      'This plan cannot be edited because the inventory data for its associated providers is not ready.',
    );
  }
  return '';
};

const deleteDisabledTooltip = ({
  t,
  isPlanExecuting,
  isPlanGathering,
  isArchivingInProgress,
  isDeleteInProgress,
}) => {
  if (isPlanExecuting) {
    return t('This plan cannot be deleted because it is running');
  } else if (isDeleteInProgress) {
    return t('This plan cannot be deleted because it is deleting');
  } else if (isPlanGathering) {
    t('This plan cannot be deleted because it is running must gather service');
  } else if (isArchivingInProgress) {
    return t('This plan cannot be deleted because it is being archived');
  }
  return '';
};

export const useFlatPlanActions = (plan: FlatPlan) => {
  const { migrationStarted, archived: isPlanArchived, name } = plan;
  const isPlanStarted = !!migrationStarted;
  const { t } = useTranslation();
  const launchModal = useModal();
  const { withNs, latestAssociatedMustGather } = React.useContext(MustGatherContext);
  const mustGather = latestAssociatedMustGather(withNs(plan.name, 'plan'));

  const isPlanGathering = mustGather?.status === 'inprogress' || mustGather?.status === 'new';
  // React.useMemo(
  //   () => kebabIsOpen && areAssociatedProvidersReady(clusterProvidersQuery, plan.spec.provider),
  //   [kebabIsOpen, clusterProvidersQuery, plan.spec.provider],
  // );
  const areProvidersReady = true;
  const editingDisabled = isPlanStarted || !areProvidersReady || isPlanArchived || isPlanGathering;
  // const conditions = plan.status?.conditions || [];
  // hasCondition(conditions, 'Executing') ||
  const isPlanExecuting = false;
  // !plan.status?.toLowerCase().includes('finished') &&
  // !plan.status?.toLowerCase().includes('failed') &&
  // !plan.status?.toLowerCase().includes('canceled');
  const isPlanCompleted = false;

  const isArchivingInProgress = plan.status === 'Archiving';
  // deletePlanMutation.isLoading ||
  const isDeleteInProgress = false;
  const deleteDisabled =
    isPlanGathering || isArchivingInProgress || isPlanExecuting || isDeleteInProgress;
  const canRestart = false;
  const cutoverScheduled = plan.status == 'Copying-CutoverScheduled';

  const editAction = useMemo(
    () => ({
      id: 'edit',
      cta: { href: `${PATH_PREFIX}/plans/${name}/edit` },
      label: t('Edit'),
      disabled: editingDisabled,
      disabledTooltip: editingDisabledTooltip({
        t,
        isPlanArchived,
        isPlanStarted,
        isPlanGathering,
        areProvidersReady,
      }),
    }),
    [t, editingDisabled, isPlanArchived, isPlanStarted, isPlanGathering, areProvidersReady, name],
  );

  const duplicateAction = useMemo(
    () => ({
      id: 'duplicate',
      cta: { href: `${PATH_PREFIX}/plans/${name}/duplicate` },
      label: t('Duplicate'),
      disabled: !areProvidersReady,
      disabledTooltip: !areProvidersReady
        ? t(
            'This plan cannot be duplicated because the inventory data for its associated providers is not ready.',
          )
        : '',
    }),
    [t, areProvidersReady, name],
  );

  const archiveAction = useMemo(
    () =>
      !isPlanArchived && {
        id: 'archive',
        cta: () => launchModal(withQueryClient(ArchiveModal), { plan }),
        label: t('Archive'),
        disabled: isPlanCompleted,
        disabledTooltip: isPlanCompleted
          ? t('This plan cannot be archived because it is not completed.')
          : '',
      },
    [t, launchModal, isPlanCompleted, isPlanArchived],
  );

  const deleteAction = useMemo(
    () => ({
      id: 'delete',
      cta: () => launchModal(withQueryClient(DeleteModal), { plan, isPlanStarted, isPlanArchived }),
      label: t('Delete'),
      disabled: deleteDisabled,
      disabledTooltip: deleteDisabledTooltip({
        t,
        isPlanGathering,
        isPlanExecuting,
        isArchivingInProgress,
        isDeleteInProgress,
      }),
    }),
    [
      t,
      launchModal,
      plan,
      deleteDisabled,
      isPlanStarted,
      isPlanArchived,
      isPlanGathering,
      isPlanExecuting,
      isArchivingInProgress,
      isDeleteInProgress,
    ],
  );

  const detailsAction = useMemo(
    () => ({
      id: 'details',
      cta: () => launchModal(withQueryClient(DetailsModal), { plan }),
      label: t('View details'),
    }),
    [t, launchModal, plan],
  );

  const restartAction = useMemo(
    () =>
      canRestart && {
        id: 'restart',
        cta: () => launchModal(withQueryClient(RestartModal), { plan }),
        label: t('Restart'),
        disabled: isPlanGathering,
        disabledTooltip: isPlanGathering
          ? t('This plan cannot be restarted because it is running must gather service')
          : '',
      },
    [launchModal, plan, t, isPlanGathering],
  );

  const cancelCutoverAction = useMemo(
    () =>
      cutoverScheduled && {
        id: 'cancelCutover',
        cta: () => useSetCutoverMutation().mutate({ plan: toIPlan(plan), cutover: null }),
        label: t('Cancel scheduled cutover'),
      },
    [plan, t],
  );
  const actions = useMemo(
    () =>
      [
        editAction,
        duplicateAction,
        archiveAction,
        deleteAction,
        detailsAction,
        restartAction,
        cancelCutoverAction,
      ].filter(Boolean),
    [
      editAction,
      duplicateAction,
      archiveAction,
      deleteAction,
      detailsAction,
      restartAction,
      cancelCutoverAction,
    ],
  );

  return [actions, true, undefined];
};

const DeleteModal = ({
  plan,
  closeModal,
  isPlanStarted,
  isPlanArchived,
}: {
  plan: FlatPlan;
  closeModal: () => void;
  isPlanStarted: boolean;
  isPlanArchived: boolean;
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const exit = () => {
    setIsOpen(false);
    closeModal();
  };
  const deletePlanMutation = useDeletePlanMutation(exit);
  return (
    <ConfirmModal
      isOpen={isOpen}
      toggleOpen={exit}
      mutateFn={() => deletePlanMutation.mutate(toIPlan(plan))}
      mutateResult={deletePlanMutation}
      title={t('Permanently delete migration plan?')}
      confirmButtonText={t('Delete')}
      body={
        isPlanStarted && !isPlanArchived ? (
          <TextContent>
            <Text>
              {t(
                'Migration plan "{{name}}" will be deleted. However, deleting a migration plan does not remove temporary resources such as failed VMs and data volumes, conversion pods, importer pods, secrets, or config maps.',
                { name: plan.name },
              )}
            </Text>
            <Text>{t('To clean up these resources, archive the plan before deleting it.')}</Text>
          </TextContent>
        ) : (
          <>{t('All data for migration plan "{{name}}" will be lost.', { name: plan.name })}</>
        )
      }
      errorText={t('Cannot delete migration plan')}
    />
  );
};

const RestartModal = ({ plan, closeModal }: { plan: FlatPlan; closeModal: () => void }) => {
  const [isOpen, setIsOpen] = useState(true);

  const exit = () => {
    setIsOpen(false);
    closeModal();
  };
  const createMigrationMutation = useCreateMigrationMutation();
  return (
    <MigrationConfirmModal
      isOpen={isOpen}
      toggleOpen={exit}
      createMigrationMutation={createMigrationMutation}
      plan={toIPlan(plan)}
      action="restart"
    />
  );
};

const DetailsModal = ({ plan, closeModal }: { plan: FlatPlan; closeModal: () => void }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const exit = () => {
    setIsOpen(false);
    closeModal();
  };
  return (
    <Modal
      variant="medium"
      title="Plan details"
      isOpen={isOpen}
      onClose={exit}
      actions={[
        <Button key="close" variant="primary" onClick={exit}>
          {t('Close')}
        </Button>,
      ]}
    >
      <PlanDetailsModal plan={toIPlan(plan)} />
    </Modal>
  );
};

const ArchiveModal = ({ plan, closeModal }: { plan: FlatPlan; closeModal: () => void }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const exit = () => {
    setIsOpen(false);
    closeModal();
  };

  const archivePlanMutation = useArchivePlanMutation(exit);
  return (
    <ConfirmModal
      isOpen={isOpen}
      toggleOpen={exit}
      mutateFn={() => archivePlanMutation.mutate(toIPlan(plan))}
      mutateResult={archivePlanMutation}
      title={t('Archive plan?')}
      body={
        <TextContent>
          <Text>{t('Archive plan "{{name}}" ?}}', { name: plan.name })}</Text>
          <Text>
            {t(
              'When a plan is archived, its history, metadata, and logs are deleted. The plan cannot be edited or restarted but it can be viewed.',
            )}
          </Text>
        </TextContent>
      }
      confirmButtonText={t('Archive')}
      errorText={t('Cannot archive plan')}
    />
  );
};

export const PlanActions = withActionContext<FlatPlan>('kebab', 'forklift-flat-plan');

// TODO reverse flattening to work with legacy components
const toIPlan = (plan: FlatPlan) => plan as unknown as IPlan;
