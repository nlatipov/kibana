/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { DataView, DataViewField } from '@kbn/data-views-plugin/common';
import { buildEmptyFilter, buildFilter, Filter } from '@kbn/es-query';
import { Operator } from '../../filter_bar/filter_editor/lib/filter_operators';
import { ConditionTypes } from './filters_editor_condition_types';

export const getConditionalOperationType = (filter: Filter): ConditionTypes | undefined => {
  const { conditionalType } = filter.meta?.params || {};

  if (conditionalType) {
    switch (conditionalType) {
      case 'or':
        return ConditionTypes.OR;
      case 'and':
        return ConditionTypes.AND;
    }
  }
};

export const getFilterDepth = (path: string) => {
  return path.split('.').length || 1;
};

export const getFilterByPath = (filters: Filter[], path: string) => {
  const depth = getFilterDepth(path);
  return depth;
};

export const addFilter = (
  filters: Filter[],
  payload: { path: string; dataViewId: string | undefined }
) => {
  const newFilter = buildEmptyFilter(true, payload.dataViewId);
  return goIntoFilersGroup(filters, orderInFilterGroup(payload.path), payload.path, newFilter);
};

export const insertFilterInFilterGroup = (arr: Filter[], index: number, newItem: Filter) => [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

export const removeFilterFromFilterGroup = (arr: Filter[], index: number) => [
  ...arr.slice(0, index),
  ...arr.slice(index + 1),
];

const orderInFilterGroup = (path: string) =>
  path.split('.').length > 0 ? Number(path.split('.')[0]) : 0;

const goIntoFilersGroup = (
  root: Filter[],
  index: number,
  path: string,
  newFilter?: Filter | undefined
): Filter[] => {
  if (getFilterDepth(path) === 1) {
    if (newFilter) {
      return insertFilterInFilterGroup(root, index + 1, newFilter);
    } else {
      return removeFilterFromFilterGroup(root, index);
    }
  } else {
    // TODO: FIX
    return goIntoFilersGroup(
      root[orderInFilterGroup(path)].meta.params.filters,
      orderInFilterGroup(path) + 1,
      path.split('.').slice(1).join('.'),
      newFilter
    );
  }
};

export const addFilterGroupWithEmptyFilter = (
  filters: Filter[],
  payload: { path: string; dataViewId: string | undefined }
) => {
  const newFilterGroup: Filter = {
    meta: {
      params: {
        conditionalType: 'or',
        filters: [buildEmptyFilter(true, payload.dataViewId)],
      },
    },
  };

  return goIntoFilersGroup(filters, orderInFilterGroup(payload.path), payload.path, newFilterGroup);
};

export const removeFilter = (filters: Filter[], payload: { path: string }) => {
  return goIntoFilersGroup(filters, orderInFilterGroup(payload.path), payload.path);
};

export const updateFilterItem = (
  filters: Filter[],
  payload: {
    dataView: DataView;
    field?: DataViewField | undefined;
    operator?: Operator | undefined;
    params?: any | undefined;
    path: string;
  }
) => {
  return filters.map((filter, i) => {
    const { dataView, field, operator, params, path } = payload;
    if (getFilterDepth(path) === 1) {
      if (!params) {
        return filter;
      }
      if (params?.conditionalType) {
        return filter;
      }
      const { $state } = filter;
      const { index, disabled = false, alias = '' } = filter.meta;
      if (field && operator) {
        return buildFilter(
          dataView,
          field,
          operator.type,
          operator.negate,
          disabled,
          params ?? '',
          alias,
          $state?.store
        );
      } else {
        return buildEmptyFilter(false, index);
      }
    } else {
      return filter;
    }
  });
};
