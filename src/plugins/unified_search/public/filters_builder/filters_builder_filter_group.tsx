/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useContext, useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiText,
  useEuiBackgroundColor,
  useEuiPaddingSize,
} from '@elastic/eui';
import { Filter, isFilter } from '@kbn/es-query';
import { cx, css } from '@emotion/css';
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

const boderPadding = css`
  padding: 16px;
`;

const borderMargin = css`
  margin: 0px 16px;
`;

const borderPadding = css`
  padding: 0px 14px;
`;

const panelPadding = css`
  padding: 14px 0px;
`;

const textPostion = css`
  position: relative;
`;

const OrDelimiter = ({ isRevert }: { isRevert: boolean }) => {
  const xsPadding = useEuiPaddingSize('xs');
  const subduedBackgroundColor = useEuiBackgroundColor('subdued');
  const plainBackgroundColor = useEuiBackgroundColor('plain');

  const delimiterText = useMemo(
    () => css`
      position: absolute;
      display: block;
      padding: ${xsPadding};
      top: 0px;
      left: 12px;
      background: ${!isRevert ? subduedBackgroundColor : plainBackgroundColor};
    `,
    [isRevert, xsPadding, subduedBackgroundColor, plainBackgroundColor]
  );

  return (
    <div className={textPostion}>
      <EuiHorizontalRule margin="s" />
      <EuiText size="xs" className={delimiterText}>
        {i18n.translate('unifiedSearch.filter.filtersBuilder.orDelimiterLabel', {
          defaultMessage: 'OR',
        })}
      </EuiText>
    </div>
  );
};

export const FilterGroup = ({
  filters,
  conditionType,
  path,
  timeRangeForSuggestionsOverride,
  reverseBackground = false,
}: FilterGroupProps) => {
  const {
    globalParams: { maxDepth, hideOr },
  } = useContext(FiltersBuilderContextType);

  const pathInArray = getPathInArray(path);
  const isDepthReached = maxDepth <= pathInArray.length;
  const orDisabled = hideOr || (isDepthReached && conditionType === ConditionTypes.AND);
  const andDisabled = isDepthReached && conditionType === ConditionTypes.OR;
  const removeDisabled = pathInArray.length <= 1 && filters.length === 1;

  const firstLevel = !path && filters.length === 1;
  let color: 'subdued' | 'plain' = 'subdued';

  if (!firstLevel) {
    color = !reverseBackground ? 'subdued' : 'plain';
  } else {
    reverseBackground = true;
  }

  return (
    <EuiPanel
      color={color}
      hasShadow={false}
      paddingSize="none"
      hasBorder
      className={cx({
        [boderPadding]: path === '',
        [panelPadding]: path !== '' && Array.isArray(filters),
      })}
    >
      {filters.map((filter, index, acc) => (
        <EuiFlexGroup direction="column" gutterSize="none">
          <EuiFlexItem
            className={cx({
              [borderMargin]: path !== '' && Array.isArray(filter),
              [borderPadding]: path !== '' && isFilter(filter),
            })}
          >
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
              {conditionType === ConditionTypes.OR ? (
                <OrDelimiter isRevert={reverseBackground} />
              ) : (
                <EuiSpacer size="s" />
              )}
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      ))}
    </EuiPanel>
  );
};
