/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useContext } from 'react';
import { i18n } from '@kbn/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiPanel, EuiText } from '@elastic/eui';
import type { Filter } from '@kbn/es-query';
import type { Path } from './filters_builder_types';
import { ConditionTypes } from '../utils';
import { FilterItem } from './filters_builder_filter_item';
import { FiltersBuilderContextType } from './filters_builder_context';
import { getPathInArray } from './filters_builder_utils';

export interface FilterGroupProps {
  filters: Filter[];
  conditionType: ConditionTypes;
  path: Path;
  timeRangeForSuggestionsOverride?: boolean;
  reverseBackground?: boolean;
}

const Delimiter = ({
  conditionType,
  isRootLevelFilterGroup,
}: {
  conditionType: ConditionTypes;
  isRootLevelFilterGroup: boolean;
}) => {
  return conditionType === ConditionTypes.OR ? (
    <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
      <EuiFlexItem
        grow={1}
        style={{ marginLeft: isRootLevelFilterGroup ? '4px' : '-12px', flexGrow: 0.12 }}
      >
        <EuiHorizontalRule margin="m" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="s" color="subdued">
          {i18n.translate('unifiedSearch.filter.filtersBuilder.orDelimiterLabel', {
            defaultMessage: 'OR',
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={10} style={{ marginRight: isRootLevelFilterGroup ? '4px' : '-12px' }}>
        <EuiHorizontalRule margin="m" />
      </EuiFlexItem>
    </EuiFlexGroup>
  ) : (
    <EuiFlexGroup>
      <EuiFlexItem grow={false} style={{ maxHeight: '8px' }}>
        <EuiHorizontalRule margin="xs" />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const FilterGroup = ({
  filters,
  conditionType,
  path,
  timeRangeForSuggestionsOverride,
  reverseBackground = true,
}: FilterGroupProps) => {
  const {
    globalParams: { maxDepth, hideOr },
  } = useContext(FiltersBuilderContextType);

  const pathInArray = getPathInArray(path);
  const isDepthReached = maxDepth <= pathInArray.length;
  const orDisabled = hideOr || (isDepthReached && conditionType === ConditionTypes.AND);
  const andDisabled = isDepthReached && conditionType === ConditionTypes.OR;
  const removeDisabled = pathInArray.length <= 1 && filters.length === 1;
  const color = !reverseBackground ? 'subdued' : 'plain';
  const isRootLevelFilterGroup = pathInArray.length <= 1;

  return (
    <EuiPanel
      color={color}
      paddingSize={`${isRootLevelFilterGroup ? 'none' : 'm'}`}
      hasShadow={false}
      hasBorder={!isRootLevelFilterGroup}
    >
      {filters.map((filter, index, acc) => (
        <EuiFlexGroup direction="column" gutterSize="none">
          <EuiFlexItem>
            <FilterItem
              filter={filter}
              path={`${path}${path ? '.' : ''}${index}`}
              timeRangeForSuggestionsOverride={timeRangeForSuggestionsOverride}
              reverseBackground={reverseBackground}
              disableOr={orDisabled}
              disableAnd={andDisabled}
              disableRemove={removeDisabled}
              color={color}
              index={index}
            />
          </EuiFlexItem>

          {conditionType && index + 1 < acc.length ? (
            <EuiFlexItem>
              <Delimiter
                conditionType={conditionType}
                isRootLevelFilterGroup={isRootLevelFilterGroup}
              />
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      ))}
    </EuiPanel>
  );
};
