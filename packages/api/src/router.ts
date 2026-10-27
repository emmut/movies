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
  catalogCreditsSchema,
  type CatalogCredits,
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
import {
  personInput,
  personCreditsInput,
  personDetailSchema,
  type PersonInput,
  type PersonCreditsInput,
  type PersonDetail,
} from './person';
import {
  regionPreferenceSchema,
  providerPreferenceSchema,
  providerChoicesSchema,
  type RegionPreference,
  type ProviderPreference,
  type ProviderChoice,
} from './preferences';
import { searchInput, searchPageSchema, type SearchInput, type SearchPage } from './search';
import { sessionUserSchema, type SessionUser } from './session';
import {
  systemListPageInput,
  systemListPageSchema,
  systemListToggleInput,
  systemListToggleSchema,
  systemListResourceInput,
  systemListMembershipSchema,
  systemListMoveInput,
  systemListMoveResultSchema,
  type SystemListMoveResult,
  type SystemListToggle,
  type SystemListPageInput,
  type SystemListPage,
  type SystemListResourceInput,
  type SystemListMembership,
  type SystemListToggleInput,
  type SystemListMoveInput,
} from './system-lists';

// Services are supplied by the host, so the router has no app, env, or database dependencies.
export type HomeService = {
  list(input: z.infer<typeof homeListInput>): Promise<MediaCard[]>;
  trending(input: z.infer<typeof trendingInput>): Promise<MediaCard[]>;
};
export type CatalogService = {
  credits(input: CatalogTitleInput): Promise<CatalogCredits>;
  details(input: CatalogDetailInput): Promise<CatalogDetail>;
  trailer(input: CatalogTitleInput): Promise<Trailer>;
  providers(input: CatalogDetailInput): Promise<ProviderGroups>;
  related(input: CatalogRelatedInput): Promise<MediaCard[]>;
};
export type DiscoveryService = {
  list(input: DiscoveryInput): Promise<DiscoveryPage>;
  options(input: DiscoveryOptionsInput): Promise<DiscoveryOptions>;
};
export type SearchService = { list(input: SearchInput): Promise<SearchPage> };
export type PersonService = {
  details(input: PersonInput): Promise<PersonDetail>;
  credits(input: PersonCreditsInput): Promise<MediaCard[]>;
};
/** Account preferences for a verified user; the router supplies the user ID from the session. */
export type PreferencesService = {
  region(userId: string): Promise<RegionPreference>;
  setRegion(userId: string, input: RegionPreference): Promise<RegionPreference>;
  providers(userId: string): Promise<ProviderPreference>;
  setProviders(userId: string, input: ProviderPreference): Promise<ProviderPreference>;
  providerOptions(input: RegionPreference): Promise<ProviderChoice[]>;
};
export type SystemListService = {
  options(userId: string, input: RegionPreference): Promise<ProviderChoice[]>;
  page(userId: string, input: SystemListPageInput): Promise<SystemListPage>;
  memberships(userId: string, input: SystemListResourceInput): Promise<SystemListMembership>;
  toggle(userId: string, input: SystemListToggleInput): Promise<SystemListToggle>;
  move(userId: string, input: SystemListMoveInput): Promise<SystemListMoveResult>;
};
export type AppServices = {
  systemLists: SystemListService;
  preferences: PreferencesService;
  person: PersonService;
  search: SearchService;
  home: HomeService;
  catalog: CatalogService;
  discovery: DiscoveryService;
};
export type AppContext = AppServices & { session?: { current(): Promise<SessionUser | null> } };
const procedure = os.$context<AppContext>();

/**
 * Private procedures derive the user from the verified session and never
 * accept a caller-supplied user ID. Anonymous accounts are accounts too, as
 * on web.
 */
const authedProcedure = procedure
  .errors({ UNAUTHORIZED: { message: 'Sign in to continue' } })
  .use(async ({ context, next, errors }) => {
    if (!context.session) {
      throw errors.UNAUTHORIZED();
    }
    const user = await context.session.current();
    if (!user) {
      throw errors.UNAUTHORIZED();
    }
    return next({ context: { user } });
  });

export const appRouter = {
  systemLists: {
    options: authedProcedure
      .input(regionPreferenceSchema)
      .output(providerChoicesSchema)
      .handler(({ input, context }) => context.systemLists.options(context.user.id, input)),
    page: authedProcedure
      .input(systemListPageInput)
      .output(systemListPageSchema)
      .handler(({ input, context }) => context.systemLists.page(context.user.id, input)),
    memberships: authedProcedure
      .input(systemListResourceInput)
      .output(systemListMembershipSchema)
      .handler(({ input, context }) => context.systemLists.memberships(context.user.id, input)),
    toggle: authedProcedure
      .input(systemListToggleInput)
      .output(systemListToggleSchema)
      .handler(({ input, context }) => context.systemLists.toggle(context.user.id, input)),
    move: authedProcedure
      .input(systemListMoveInput)
      .output(systemListMoveResultSchema)
      .errors({ NOT_FOUND: { message: 'Item not found' } })
      .handler(({ input, context }) => context.systemLists.move(context.user.id, input)),
  },
  session: {
    current: procedure.output(sessionUserSchema.nullable()).handler(async ({ context }) => {
      if (!context.session) {
        return null;
      }
      return context.session.current();
    }),
  },
  preferences: {
    providers: authedProcedure
      .output(providerPreferenceSchema)
      .handler(({ context }) => context.preferences.providers(context.user.id)),
    setProviders: authedProcedure
      .input(providerPreferenceSchema)
      .output(providerPreferenceSchema)
      .handler(({ input, context }) => context.preferences.setProviders(context.user.id, input)),
    providerOptions: authedProcedure
      .input(regionPreferenceSchema)
      .output(providerChoicesSchema)
      .handler(({ input, context }) => context.preferences.providerOptions(input)),
    region: authedProcedure
      .output(regionPreferenceSchema)
      .handler(({ context }) => context.preferences.region(context.user.id)),
    setRegion: authedProcedure
      .input(regionPreferenceSchema)
      .output(regionPreferenceSchema)
      .handler(({ input, context }) => context.preferences.setRegion(context.user.id, input)),
  },
  person: {
    details: procedure
      .input(personInput)
      .output(personDetailSchema)
      .errors({ NOT_FOUND: { message: 'Person not found' } })
      .handler(({ input, context }) => context.person.details(input)),
    credits: procedure
      .input(personCreditsInput)
      .output(z.array(mediaCardSchema))
      .handler(({ input, context }) => context.person.credits(input)),
  },
  search: {
    list: procedure
      .input(searchInput)
      .output(searchPageSchema)
      .handler(({ input, context }) => context.search.list(input)),
  },
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
    credits: procedure
      .input(catalogTitleInput)
      .output(catalogCreditsSchema)
      .handler(({ input, context }) => context.catalog.credits(input)),
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
