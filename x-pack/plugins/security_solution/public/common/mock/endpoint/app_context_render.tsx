/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { createMemoryHistory } from 'history';
import { render as reactRender, RenderOptions, RenderResult } from '@testing-library/react';
import { Action, Reducer, Store } from 'redux';
import { coreMock } from '../../../../../../../src/core/public/mocks';
import { StartPlugins, StartServices } from '../../../types';
import { depsStartMock } from './dependencies_start_mock';
import { MiddlewareActionSpyHelper, createSpyMiddleware } from '../../store/test_utils';
import { kibanaObservable } from '../test_providers';
import { createStore, State } from '../../store';
import { AppRootProvider } from './app_root_provider';
import { managementMiddlewareFactory } from '../../../management/store/middleware';
import { createStartServicesMock } from '../../lib/kibana/kibana_react.mock';
import { SUB_PLUGINS_REDUCER, mockGlobalState, createSecuritySolutionStorageMock } from '..';
import { ExperimentalFeatures } from '../../../../common/experimental_features';
import { PLUGIN_ID } from '../../../../../fleet/common';
import { APP_ID } from '../../../../common/constants';
import { KibanaContextProvider } from '../../lib/kibana';

type UiRender = (ui: React.ReactElement, options?: RenderOptions) => RenderResult;

/**
 * Mocked app root context renderer
 */
export interface AppContextTestRender {
  store: Store<State>;
  history: ReturnType<typeof createMemoryHistory>;
  coreStart: ReturnType<typeof coreMock.createStart>;
  depsStart: Pick<StartPlugins, 'data' | 'fleet'>;
  startServices: StartServices;
  middlewareSpy: MiddlewareActionSpyHelper;
  /**
   * A wrapper around `AppRootContext` component. Uses the mocked modules as input to the
   * `AppRootContext`
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AppWrapper: React.FC<any>;
  /**
   * Renders the given UI within the created `AppWrapper` providing the given UI a mocked
   * endpoint runtime context environment
   */
  render: UiRender;

  /**
   * Set experimental features on/off. Calling this method updates the Store with the new values
   * for the given feature flags
   * @param flags
   */
  setExperimentalFlag: (flags: Partial<ExperimentalFeatures>) => void;
}

// Defined a private custom reducer that reacts to an action that enables us to updat the
// store with new values for experimental features/flags. Because the `action.type` is a `Symbol`,
// and its not exported the action can only be `dispatch`'d from this module
const UpdateExperimentalFeaturesTestActionType = Symbol('updateExperimentalFeaturesTestAction');

type UpdateExperimentalFeaturesTestAction = Action<
  typeof UpdateExperimentalFeaturesTestActionType
> & {
  payload: Partial<ExperimentalFeatures>;
};

const experimentalFeaturesReducer: Reducer<State['app'], UpdateExperimentalFeaturesTestAction> = (
  state = mockGlobalState.app,
  action
) => {
  if (action.type === UpdateExperimentalFeaturesTestActionType) {
    return {
      ...state,
      enableExperimental: {
        ...state.enableExperimental!,
        ...action.payload,
      },
    };
  }
  return state;
};

/**
 * Creates a mocked endpoint app context custom renderer that can be used to render
 * component that depend upon the application's surrounding context providers.
 * Factory also returns the content that was used to create the custom renderer, allowing
 * for further customization.
 */
export const createAppRootMockRenderer = (): AppContextTestRender => {
  const history = createMemoryHistory<never>();
  const coreStart = createCoreStartMock();
  const depsStart = depsStartMock();
  const middlewareSpy = createSpyMiddleware();
  const { storage } = createSecuritySolutionStorageMock();
  const startServices: StartServices = {
    ...createStartServicesMock(),
    ...coreStart,
  };

  const storeReducer = {
    ...SUB_PLUGINS_REDUCER,
    // This is ok here because the store created by this testing utility (see below) does
    // not pull in the non-sub-plugin reducers
    app: experimentalFeaturesReducer,
  };

  const store = createStore(mockGlobalState, storeReducer, kibanaObservable, storage, [
    ...managementMiddlewareFactory(coreStart, depsStart),
    middlewareSpy.actionSpyMiddleware,
  ]);

  const AppWrapper: React.FC<{ children: React.ReactElement }> = ({ children }) => (
    <KibanaContextProvider services={startServices}>
      <AppRootProvider store={store} history={history} coreStart={coreStart} depsStart={depsStart}>
        {children}
      </AppRootProvider>
    </KibanaContextProvider>
  );
  const render: UiRender = (ui, options) => {
    return reactRender(ui, {
      wrapper: AppWrapper as React.ComponentType,
      ...options,
    });
  };

  const setExperimentalFlag: AppContextTestRender['setExperimentalFlag'] = (flags) => {
    store.dispatch({
      type: UpdateExperimentalFeaturesTestActionType,
      payload: flags,
    });
  };

  return {
    store,
    history,
    coreStart,
    depsStart,
    startServices,
    middlewareSpy,
    AppWrapper,
    render,
    setExperimentalFlag,
  };
};

const createCoreStartMock = (): ReturnType<typeof coreMock.createStart> => {
  const coreStart = coreMock.createStart({ basePath: '/mock' });

  // Mock the certain APP Ids returned by `application.getUrlForApp()`
  coreStart.application.getUrlForApp.mockImplementation((appId) => {
    switch (appId) {
      case PLUGIN_ID:
        return '/app/fleet';
      case APP_ID:
        return '/app/security';
      default:
        return `${appId} not mocked!`;
    }
  });

  return coreStart;
};
