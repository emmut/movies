import { os, type RouterClient } from '@orpc/server';
import { z } from 'zod';

import {
  catalogDetailInput,
  catalogDetailSchema,
  type CatalogDetail,
  type CatalogDetailInput,
} from './catalog';
import {
  catalogTitleInput,
  catalogRelatedInput,
  trailerSchema,
  providerGroupsSchema,
  relatedTitlesSchema,
  type CatalogTitleInput,
  type CatalogRelatedInput,
  type Trailer,
  type ProviderGroups,
} from './catalog-support';
import {
  discoveryInput,
  discoveryOptionsInput,
  discoveryPageSchema,
  discoveryOptionsSchema,
  type DiscoveryInput,
  type DiscoveryOptionsInput,
  type DiscoveryPage,
  type DiscoveryOptions,
} from './discover';
import { homeListInput, trendingInput, mediaCardSchema, type MediaCard } from './home';

// Services are supplied by the host, so the router has no app, env, or database dependencies.
export type HomeService = {
  list(input: z.infer<typeof homeListInput>): Promise<MediaCard[]>;
  trending(input: z.infer<typeof trendingInput>): Promise<MediaCard[]>;
};
export type CatalogService = {
  details(input: CatalogDetailInput): Promise<CatalogDetail>;
  trailer(input: CatalogTitleInput): Promise<Trailer>;
  providers(input: CatalogDetailInput): Promise<ProviderGroups>;
  related(input: CatalogRelatedInput): Promise<MediaCard[]>;
};
export type DiscoveryService = {
  list(input: DiscoveryInput): Promise<DiscoveryPage>;
  options(input: DiscoveryOptionsInput): Promise<DiscoveryOptions>;
};
export type AppServices = {
  home: HomeService;
  catalog: CatalogService;
  discovery: DiscoveryService;
};
const procedure = os.$context<AppServices>();
export const appRouter = {
  discovery: {
    list: procedure
      .input(discoveryInput)
      .output(discoveryPageSchema)
      .handler(({ input, context }) => context.discovery.list(input)),
    options: procedure
      .input(discoveryOptionsInput)
      .output(discoveryOptionsSchema)
      .handler(({ input, context }) => context.discovery.options(input)),
  },
  catalog: {
    trailer: procedure
      .input(catalogTitleInput)
      .output(trailerSchema)
      .handler(({ input, context }) => context.catalog.trailer(input)),
    providers: procedure
      .input(catalogDetailInput)
      .output(providerGroupsSchema)
      .handler(({ input, context }) => context.catalog.providers(input)),
    related: procedure
      .input(catalogRelatedInput)
      .output(relatedTitlesSchema)
      .handler(({ input, context }) => context.catalog.related(input)),
    details: procedure
      .input(catalogDetailInput)
      .output(catalogDetailSchema)
      .errors({ NOT_FOUND: { message: 'Title not found' } })
      .handler(({ input, context }) => context.catalog.details(input)),
  },
  home: {
    list: procedure
      .input(homeListInput)
      .output(z.array(mediaCardSchema))
      .handler(({ input, context }) => context.home.list(input)),
    trending: procedure
      .input(trendingInput)
      .output(z.array(mediaCardSchema))
      .handler(({ input, context }) => context.home.trending(input)),
  },
};
export type AppRouterClient = RouterClient<typeof appRouter>;
