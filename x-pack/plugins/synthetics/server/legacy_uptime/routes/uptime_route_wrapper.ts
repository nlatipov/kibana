/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KibanaResponse } from '@kbn/core-http-router-server-internal';
import { UMKibanaRouteWrapper } from './types';
import { createUptimeESClient, isTestUser } from '../lib/lib';

export const uptimeRouteWrapper: UMKibanaRouteWrapper = (uptimeRoute, server) => ({
  ...uptimeRoute,
  options: {
    tags: ['access:uptime-read', ...(uptimeRoute?.writeAccess ? ['access:uptime-write'] : [])],
  },
  handler: async (context, request, response) => {
    const coreContext = await context.core;
    const { client: esClient } = coreContext.elasticsearch;

    server.authSavedObjectsClient = coreContext.savedObjects.client;

    const uptimeEsClient = createUptimeESClient({
      request,
      isDev: server.isDev && !isTestUser(server),
      savedObjectsClient: coreContext.savedObjects.client,
      esClient: esClient.asCurrentUser,
      uiSettings: coreContext.uiSettings,
    });

    server.uptimeEsClient = uptimeEsClient;

    const res = await uptimeRoute.handler({
      uptimeEsClient,
      savedObjectsClient: coreContext.savedObjects.client,
      context,
      request,
      response,
      server,
    });

    if (res instanceof KibanaResponse) {
      return res;
    }

    return response.ok({
      body: {
        ...res,
        ...uptimeEsClient.getInspectData(uptimeRoute.path),
      },
    });
  },
});
