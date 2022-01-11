/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { Settings, TooltipType, SeriesIdentifier } from '@elastic/charts';
import { chartPluginMock } from '../../../../charts/public/mocks';
import { dataPluginMock } from '../../../../data/public/mocks';
import { fieldFormatsServiceMock } from '../../../../field_formats/public/mocks';
import type { Datatable } from '../../../../expressions/public';
import { shallow, mount } from 'enzyme';
import { findTestSubject } from '@elastic/eui/lib/test';
import { act } from 'react-dom/test-utils';
import PieComponent, { PieComponentProps } from './pie_vis_component';
import { createMockPieParams, createMockVisData } from '../mocks';

jest.mock('@elastic/charts', () => {
  const original = jest.requireActual('@elastic/charts');

  return {
    ...original,
    getSpecId: jest.fn(() => {}),
  };
});

const chartsThemeService = chartPluginMock.createSetupContract().theme;
const palettesRegistry = chartPluginMock.createPaletteRegistry();
const visParams = createMockPieParams();
const visData = createMockVisData();

const mockState = new Map();
const uiState = {
  get: jest
    .fn()
    .mockImplementation((key, fallback) => (mockState.has(key) ? mockState.get(key) : fallback)),
  set: jest.fn().mockImplementation((key, value) => mockState.set(key, value)),
  emit: jest.fn(),
  setSilent: jest.fn(),
} as any;

describe('PieComponent', function () {
  let wrapperProps: PieComponentProps;

  beforeAll(() => {
    wrapperProps = {
      chartsThemeService,
      palettesRegistry,
      visParams,
      visData,
      uiState,
      syncColors: false,
      fireEvent: jest.fn(),
      renderComplete: jest.fn(),
      services: {
        data: dataPluginMock.createStartContract(),
        fieldFormats: fieldFormatsServiceMock.createStartContract(),
      },
    };
  });

  it('renders the legend on the correct position', () => {
    const component = shallow(<PieComponent {...wrapperProps} />);
    expect(component.find(Settings).prop('legendPosition')).toEqual('right');
  });

  it('renders the legend toggle component', async () => {
    const component = mount(<PieComponent {...wrapperProps} />);
    await act(async () => {
      expect(findTestSubject(component, 'vislibToggleLegend').length).toBe(1);
    });
  });

  it('hides the legend if the legend toggle is clicked', async () => {
    const component = mount(<PieComponent {...wrapperProps} />);
    findTestSubject(component, 'vislibToggleLegend').simulate('click');
    await act(async () => {
      expect(component.find(Settings).prop('showLegend')).toEqual(false);
    });
  });

  it('defaults on showing the legend for the inner cicle', () => {
    const component = shallow(<PieComponent {...wrapperProps} />);
    expect(component.find(Settings).prop('legendMaxDepth')).toBe(1);
  });

  it('shows the nested legend when the user requests it', () => {
    const newParams = { ...visParams, nestedLegend: true };
    const newProps = { ...wrapperProps, visParams: newParams };
    const component = shallow(<PieComponent {...newProps} />);
    expect(component.find(Settings).prop('legendMaxDepth')).toBeUndefined();
  });

  it('defaults on displaying the tooltip', () => {
    const component = shallow(<PieComponent {...wrapperProps} />);
    expect(component.find(Settings).prop('tooltip')).toStrictEqual({ type: TooltipType.Follow });
  });

  it('doesnt show the tooltip when the user requests it', () => {
    const newParams = { ...visParams, addTooltip: false };
    const newProps = { ...wrapperProps, visParams: newParams };
    const component = shallow(<PieComponent {...newProps} />);
    expect(component.find(Settings).prop('tooltip')).toStrictEqual({ type: TooltipType.None });
  });

  it('calls filter callback', () => {
    const component = shallow(<PieComponent {...wrapperProps} />);
    component.find(Settings).first().prop('onElementClick')!([
      [
        [
          {
            groupByRollup: 6,
            value: 6,
            depth: 1,
            path: [],
            sortIndex: 1,
            smAccessorValue: 'Logstash Airways',
          },
        ],
        {} as SeriesIdentifier,
      ],
    ]);
    expect(wrapperProps.fireEvent).toHaveBeenCalled();
  });

  it('renders the no results component if all the values are zero', () => {
    const newVisData = {
      type: 'datatable',
      columns: [
        {
          id: 'col-1-1',
          name: 'Count',
        },
        {
          id: 'col-0-2',
          name: 'filters',
        },
      ],
      rows: [
        {
          'col-0-2': 'Carrier : "JetBeats" ',
          'col-1-1': 0,
        },
        {
          'col-0-2': 'Carrier : "ES-Air" ',
          'col-1-1': 0,
        },
      ],
    } as unknown as Datatable;
    const newProps = { ...wrapperProps, visData: newVisData };
    const component = mount(<PieComponent {...newProps} />);
    expect(findTestSubject(component, 'pieVisualizationError').text()).toEqual('No results found');
  });

  it('renders the no results component if there are negative values', () => {
    const newVisData = {
      type: 'datatable',
      columns: [
        {
          id: 'col-1-1',
          name: 'Count',
        },
        {
          id: 'col-0-2',
          name: 'filters',
        },
      ],
      rows: [
        {
          'col-0-2': 'Carrier : "JetBeats" ',
          'col-1-1': -10,
        },
        {
          'col-0-2': 'Carrier : "ES-Air" ',
          'col-1-1': -10,
        },
      ],
    } as unknown as Datatable;
    const newProps = { ...wrapperProps, visData: newVisData };
    const component = mount(<PieComponent {...newProps} />);
    expect(findTestSubject(component, 'pieVisualizationError').text()).toEqual(
      "Pie/donut charts can't render with negative values."
    );
  });
});
