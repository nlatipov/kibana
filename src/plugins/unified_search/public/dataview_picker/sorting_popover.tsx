/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useCallback, useState } from 'react';
import {
  EuiSelectable,
  EuiPopover,
  EuiButtonIcon,
  EuiPopoverTitle,
  EuiHorizontalRule,
  useEuiTheme,
} from '@elastic/eui';
import type { EuiSelectableOption } from '@elastic/eui';

import { optionsListStrings } from './dataview_list_strings';
import { SortingService } from './sorting_service';
import type { DataViewListItemEnhanced } from './dataview_list';

export interface SortingPopoverProps {
  handleSortingChange: () => void;
  sortingService: SortingService<DataViewListItemEnhanced>;
}

function toSelectableOption(key: string, isChecked: boolean, label: string): EuiSelectableOption {
  return {
    data: { key },
    checked: isChecked ? 'on' : undefined,
    label,
  };
}

export function SortingPopover({ sortingService, handleSortingChange }: SortingPopoverProps) {
  const { euiTheme } = useEuiTheme();
  const popoverStyle = euiTheme.base * 13;

  const [isSortingPopoverOpen, setIsSortingPopoverOpen] = useState(false);

  const [sortByOptions, setSortByOptions] = useState<EuiSelectableOption[]>(() => {
    return sortingService
      .getColumns()
      .map((key) =>
        toSelectableOption(
          key,
          key === sortingService.column,
          optionsListStrings.editorAndPopover.sortBy[key].getSortByLabel()
        )
      );
  });

  const [sortDirectionOptions, setSortDirectionOptions] = useState<EuiSelectableOption[]>(() => {
    return sortingService
      .getOrderDirections()
      .map((key) =>
        toSelectableOption(
          key,
          key === sortingService.direction,
          optionsListStrings.editorAndPopover.sortOrder[key].getSortOrderLabel()
        )
      );
  });

  const onChangeSortDirection = useCallback(
    (updatedOptions: EuiSelectableOption[]) => {
      const selectedOption = updatedOptions.find(({ checked }) => checked === 'on');

      setSortDirectionOptions(updatedOptions);
      if (selectedOption?.data?.key) {
        const key = selectedOption.data.key;

        sortingService.setDirection(key);
        handleSortingChange();
      }
    },
    [handleSortingChange, sortingService]
  );

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          iconType="sortable"
          onClick={() => setIsSortingPopoverOpen(!isSortingPopoverOpen)}
          aria-label={optionsListStrings.popover.getSortPopoverDescription()}
          data-test-subj="openPopoverButton"
        />
      }
      panelPaddingSize="none"
      isOpen={isSortingPopoverOpen}
      aria-labelledby="optionsList_sortingOptions"
      closePopover={() => setIsSortingPopoverOpen(false)}
    >
      <EuiPopoverTitle paddingSize="s">
        {optionsListStrings.popover.getSortPopoverTitle()}
      </EuiPopoverTitle>

      <EuiSelectable
        options={sortByOptions}
        singleSelection="always"
        onChange={setSortByOptions}
        listProps={{ bordered: false }}
        aria-label={optionsListStrings.popover.getSortPopoverDescription()}
        style={{ width: popoverStyle }}
      >
        {(sortByOptionList) => sortByOptionList}
      </EuiSelectable>

      <EuiHorizontalRule margin="none" />

      <EuiPopoverTitle paddingSize="s">
        {optionsListStrings.popover.getOrderPopoverTitle()}
      </EuiPopoverTitle>
      <EuiSelectable
        options={sortDirectionOptions}
        singleSelection="always"
        onChange={onChangeSortDirection}
        listProps={{ bordered: false }}
        aria-label={optionsListStrings.popover.getSortPopoverDescription()}
        style={{ width: popoverStyle }}
      >
        {(sortOrderOptionList) => sortOrderOptionList}
      </EuiSelectable>
    </EuiPopover>
  );
}
