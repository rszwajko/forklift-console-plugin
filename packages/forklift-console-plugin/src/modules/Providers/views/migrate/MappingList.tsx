import React, { FC } from 'react';
import { useForkliftTranslation } from 'src/utils/i18n';

import {
  Button,
  DataList,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Select,
  SelectVariant,
} from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';

import { useToggle } from '../../hooks';

import './ProvidersCreateVmMigration.style.css';

export interface Mapping {
  source: string;
  destination: string;
}

interface MappingListProps {
  mappings: Mapping[];
  availableSources: string[];
  availableDestinations: string[];
  replaceMapping: (val: { current: Mapping; next: Mapping }) => void;
  deleteMapping: (mapping: Mapping) => void;
  addMapping: (mapping: Mapping) => void;
}

export const MappingList: FC<MappingListProps> = ({
  mappings,
  availableSources,
  availableDestinations,
  replaceMapping,
  deleteMapping,
  addMapping,
}) => {
  const { t } = useForkliftTranslation();
  return (
    <>
      <DataList isCompact aria-label="">
        {mappings.map((item, index) => (
          <MappingItem
            {...item}
            replaceMapping={replaceMapping}
            deleteMapping={deleteMapping}
            index={index}
            key={index}
          />
        ))}
      </DataList>
      <Button
        onClick={() =>
          addMapping({ source: availableSources?.[0], destination: availableDestinations?.[0] })
        }
        type="button"
        variant="link"
        isDisabled={!availableSources?.length}
        icon={<PlusCircleIcon />}
      >
        {t('Add mapping')}
      </Button>
    </>
  );
};

interface MappingItemProps {
  source: string;
  destination: string;
  index: number;
  replaceMapping: (val: { current: Mapping; next: Mapping }) => void;
  deleteMapping: (mapping: Mapping) => void;
}
const MappingItem: FC<MappingItemProps> = ({
  source,
  destination,
  index,
  replaceMapping,
  deleteMapping,
}) => {
  const { t } = useForkliftTranslation();
  const [isSrcOpen, setToggleSrcOpen] = useToggle(false);
  const [isTrgOpen, setToggleTrgOpen] = useToggle(false);
  return (
    <DataListItem aria-labelledby="">
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key="source">
              <Select
                variant={SelectVariant.single}
                aria-label=""
                onToggle={setToggleSrcOpen}
                onSelect={(event, value: string) =>
                  replaceMapping({
                    current: { source, destination },
                    next: { source: value, destination },
                  })
                }
                selections={source}
                isOpen={isSrcOpen}
                aria-labelledby=""
              />
            </DataListCell>,
            <DataListCell key="destination">
              <Select
                variant={SelectVariant.single}
                aria-label=""
                onToggle={setToggleTrgOpen}
                onSelect={(event, value: string) =>
                  replaceMapping({
                    current: { source, destination },
                    next: { source, destination: value },
                  })
                }
                selections={source}
                isOpen={isTrgOpen}
                aria-labelledby=""
              />
            </DataListCell>,
          ]}
        />
        <DataListAction
          id={`mapping_list_item_${index}`}
          aria-label={t('Actions')}
          aria-labelledby=""
        >
          <Button
            onClick={() => deleteMapping({ source, destination })}
            variant="plain"
            aria-label={t('Delete mapping')}
            key="delete-action"
            icon={<MinusCircleIcon />}
          />
        </DataListAction>
      </DataListItemRow>
    </DataListItem>
  );
};
