/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useCallback, useContext, useMemo } from 'react';
import {
  EuiButtonIcon,
  EuiDraggable,
  EuiDroppable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiPanel,
  useEuiTheme,
} from '@elastic/eui';
import { buildEmptyFilter, FieldFilter, Filter, getFilterParams } from '@kbn/es-query';
import { DataViewField } from '@kbn/data-views-plugin/common';
import { i18n } from '@kbn/i18n';
import { cx, css } from '@emotion/css';

import add from '../assets/add.svg';
import or from '../assets/or.svg';

import { FieldInput } from './filters_builder_filter_item_field_input';
import { OperatorInput } from './filters_builder_filter_item_operator_input';
import { ParamsEditor } from './filters_builder_filter_item_params_editor';
import { ConditionTypes, getConditionalOperationType } from '../../utils';
import { FiltersBuilderContextType } from '../filters_builder_context';
import { FilterGroup } from '../filters_builder_filter_group';
import type { Path } from '../filters_builder_types';
import { getFieldFromFilter, getOperatorFromFilter } from '../../filter_bar/filter_editor';
import { Operator } from '../../filter_bar/filter_editor';

export interface FilterItemProps {
  path: Path;
  filter: Filter;
  timeRangeForSuggestionsOverride?: boolean;
  disableOr: boolean;
  disableAnd: boolean;
  disableRemove: boolean;
  color: 'plain' | 'subdued';
  index: number;

  /** @internal used for recursive rendering **/
  renderedLevel: number;
  reverseBackground: boolean;
}

const cursorAddStyles = css`
  cursor: url(${add}), auto;
`;

const cursorOrStyles = css`
  cursor: url(${or}), auto;
`;

export function FilterItem({
  filter,
  path,
  timeRangeForSuggestionsOverride,
  reverseBackground,
  disableOr,
  disableAnd,
  disableRemove,
  color,
  index,
  renderedLevel,
}: FilterItemProps) {
  const {
    dispatch,
    dataView,
    dropTarget,
    globalParams: { hideOr },
  } = useContext(FiltersBuilderContextType);
  const conditionalOperationType = getConditionalOperationType(filter);
  const { euiTheme } = useEuiTheme();

  const grabIconStyles = useMemo(
    () => css`
      margin-left: ${euiTheme.size.xs};
      margin-right: ${euiTheme.size.xxs};
    `,
    [euiTheme.size.xs, euiTheme.size.xxs]
  );

  let field: DataViewField | undefined;
  let operator: Operator | undefined;
  let params: Filter['meta']['params'] | undefined;

  if (!conditionalOperationType) {
    field = getFieldFromFilter(filter as FieldFilter, dataView);
    operator = getOperatorFromFilter(filter);
    params = getFilterParams(filter);
  }

  const onHandleField = useCallback(
    (selectedField: DataViewField) => {
      dispatch({
        type: 'updateFilter',
        payload: { path, field: selectedField },
      });
    },
    [dispatch, path]
  );

  const onHandleOperator = useCallback(
    (selectedOperator: Operator) => {
      dispatch({
        type: 'updateFilter',
        payload: { path, field, operator: selectedOperator },
      });
    },
    [dispatch, path, field]
  );

  const onHandleParamsChange = useCallback(
    (selectedParams: string) => {
      dispatch({
        type: 'updateFilter',
        payload: { path, field, operator, params: selectedParams },
      });
    },
    [dispatch, path, field, operator]
  );

  const onHandleParamsUpdate = useCallback(
    (value: Filter['meta']['params']) => {
      dispatch({
        type: 'updateFilter',
        payload: { path, params: [value, ...(params || [])] },
      });
    },
    [dispatch, path, params]
  );

  const onRemoveFilter = useCallback(() => {
    dispatch({
      type: 'removeFilter',
      payload: {
        path,
      },
    });
  }, [dispatch, path]);

  const onAddFilter = useCallback(
    (conditionalType: ConditionTypes) => {
      dispatch({
        type: 'addFilter',
        payload: {
          path,
          filter: buildEmptyFilter(false, dataView.id),
          conditionalType,
        },
      });
    },
    [dispatch, dataView.id, path]
  );

  const onAddButtonClick = useCallback(() => onAddFilter(ConditionTypes.AND), [onAddFilter]);
  const onOrButtonClick = useCallback(() => onAddFilter(ConditionTypes.OR), [onAddFilter]);

  if (!dataView) {
    return null;
  }

  return (
    <div
      className={cx({
        'filter-builder__item': renderedLevel > 0,
      })}
    >
      {conditionalOperationType ? (
        <div>
          <FilterGroup
            path={path}
            conditionType={conditionalOperationType}
            filters={Array.isArray(filter) ? filter : filter.meta?.params}
            timeRangeForSuggestionsOverride={timeRangeForSuggestionsOverride}
            reverseBackground={!reverseBackground}
            renderedLevel={renderedLevel + 1}
          />
        </div>
      ) : (
        <EuiDroppable
          droppableId={path}
          spacing="none"
          isCombineEnabled={!disableOr || !hideOr}
          className={cx({ [cursorAddStyles]: dropTarget === path })}
          isDropDisabled={disableAnd}
        >
          <EuiDraggable
            spacing="s"
            key={JSON.stringify(filter)}
            index={index}
            draggableId={`${path}`}
            customDragHandle={true}
            hasInteractiveChildren={true}
          >
            {(provided) => (
              <EuiFlexGroup
                gutterSize="s"
                responsive={false}
                alignItems="center"
                justifyContent="center"
                className={cx({
                  [cursorOrStyles]: dropTarget === path && !hideOr,
                })}
              >
                <EuiFlexItem>
                  <EuiPanel color={color} paddingSize={'none'} hasShadow={false}>
                    <EuiFlexGroup
                      gutterSize="s"
                      responsive={false}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <EuiFlexItem grow={false} {...provided.dragHandleProps}>
                        <EuiIcon type="grab" size="s" className={grabIconStyles} />
                      </EuiFlexItem>
                      <EuiFlexItem grow={10}>
                        <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="center">
                          <EuiFlexItem grow={4}>
                            <EuiFormRow fullWidth>
                              <FieldInput
                                field={field}
                                dataView={dataView}
                                onHandleField={onHandleField}
                              />
                            </EuiFormRow>
                          </EuiFlexItem>
                          <EuiFlexItem grow={2}>
                            <EuiFormRow fullWidth>
                              <OperatorInput
                                field={field}
                                operator={operator}
                                params={params}
                                onHandleOperator={onHandleOperator}
                              />
                            </EuiFormRow>
                          </EuiFlexItem>
                          <EuiFlexItem grow={4}>
                            <EuiFormRow fullWidth>
                              <ParamsEditor
                                dataView={dataView}
                                field={field}
                                operator={operator}
                                params={params}
                                onHandleParamsChange={onHandleParamsChange}
                                onHandleParamsUpdate={onHandleParamsUpdate}
                                timeRangeForSuggestionsOverride={timeRangeForSuggestionsOverride}
                              />
                            </EuiFormRow>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <EuiFlexItem grow={1}>
                        <EuiFlexGroup
                          responsive={false}
                          justifyContent="center"
                          alignItems="flexStart"
                          gutterSize="s"
                        >
                          <EuiFlexItem grow={false}>
                            <EuiButtonIcon
                              onClick={onRemoveFilter}
                              iconType="trash"
                              isDisabled={disableRemove}
                              size="s"
                              color="danger"
                              aria-label={i18n.translate(
                                'unifiedSearch.filter.filtersBuilder.deleteFilterGroupButttonIcon',
                                {
                                  defaultMessage: 'Delete filter group',
                                }
                              )}
                            />
                          </EuiFlexItem>
                          {!hideOr ? (
                            <EuiFlexItem grow={false}>
                              <EuiButtonIcon
                                onClick={onOrButtonClick}
                                isDisabled={disableOr}
                                iconType="returnKey"
                                size="s"
                                aria-label={i18n.translate(
                                  'unifiedSearch.filter.filtersBuilder.addOrFilterGroupButttonIcon',
                                  {
                                    defaultMessage: 'Add filter group with OR',
                                  }
                                )}
                              />
                            </EuiFlexItem>
                          ) : null}
                          <EuiFlexItem grow={false}>
                            <EuiButtonIcon
                              display="base"
                              onClick={onAddButtonClick}
                              isDisabled={disableAnd}
                              iconType="plus"
                              size="s"
                              aria-label={i18n.translate(
                                'unifiedSearch.filter.filtersBuilder.addAndFilterGroupButttonIcon',
                                {
                                  defaultMessage: 'Add filter group with AND',
                                }
                              )}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
          </EuiDraggable>
        </EuiDroppable>
      )}
    </div>
  );
}
