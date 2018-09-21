/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { styleSheetPaths } from './style_sheet_paths';

describe('uiExports.styleSheetPaths', () => {
  const pluginSpec = {
    getId: () => 'test',
    getPublicDir: () => '/kibana/public'
  };

  it('does not support relative paths', () => {
    expect(() => styleSheetPaths([], 'public/bar.css', 'styleSheetPaths', pluginSpec))
      .toThrowError('[plugin:test] uiExports.styleSheetPaths must be an absolute path, got "public/bar.css"');
  });

  it('path must be child of public path', () => {
    expect(() => styleSheetPaths([], '/another/public/bar.css', 'styleSheetPaths', pluginSpec))
      .toThrowError('[plugin:test] uiExports.styleSheetPaths must be child of publicDir [/kibana/public]');
  });

  it('only supports css or scss extensions', () => {
    expect(() => styleSheetPaths([], '/kibana/public/bar.bad', 'styleSheetPaths', pluginSpec))
      .toThrowError('[plugin:test] uiExports.styleSheetPaths supported extensions [.css, .scss], got ".bad"');
  });

  it('provides publicPath for scss extensions', () => {
    const localPath = '/kibana/public/bar.scss';
    const uiExports = styleSheetPaths([], localPath, 'styleSheetPaths', pluginSpec);

    expect(uiExports.styleSheetPaths).toHaveLength(1);
    expect(uiExports.styleSheetPaths[0].localPath).toEqual(localPath);
    expect(uiExports.styleSheetPaths[0].publicPath).toEqual('plugins/test/bar.css');
  });

  it('provides publicPath for css extensions', () => {
    const localPath = '/kibana/public/bar.css';
    const uiExports = styleSheetPaths([], localPath, 'styleSheetPaths', pluginSpec);

    expect(uiExports.styleSheetPaths).toHaveLength(1);
    expect(uiExports.styleSheetPaths[0].localPath).toEqual(localPath);
    expect(uiExports.styleSheetPaths[0].publicPath).toEqual('plugins/test/bar.css');
  });
});