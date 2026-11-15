import { os, type RouterClient, type InferSchemaOutput } from '@orpc/server';
import { z } from 'zod';

import {
  catalogDetailInput,
  catalogDetailSchema,
  type CatalogDetail,
  type CatalogDetailInput,
} from './catalog';
import {
  catalogTitleInput,
  directWatchLinksSchema,
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
import { customListContracts, type CustomListService } from './custom-lists';
import {
  discoveryFacetInput,
  discoveryChoice,
  type DiscoveryFacetInput,
  type DiscoveryChoice,
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
  imdbRatingSchema,
  catalogImdbSchema,
  imdbIdSchema,
  imdbTitleSchema,
  type ImdbTitle,
  type CatalogImdb,
} from './imdb';
import {
  movieMetadataSchema,
  tvMetadataSchema,
  movieCreditMetadataSchema,
  tvCreditMetadataSchema,
  aggregateCreditMetadataSchema,
  availabilitySchema,
  externalIdsSchema,
  personMetadataSchema,
  personMovieCreditsSchema,
  personTvCreditsSchema,
  genreRecordsSchema,
  providerRecordSchema,
  certificationSchema,
  ratingInput,
  type CatalogMetadataService,
  type PersonMetadataService,
} from './metadata';
import type { MutationEffect, MutationEvent } from './mutation-effects';
import {
  pdpExtrasSchema,
  seasonInput,
  seasonPageSchema,
  collectionPageSchema,
  pdpEntityInput,
  keywordInput,
  keywordPageSchema,
  type PdpService,
} from './pdp';
import {
  personInput,
  personCreditsInput,
  personDetailSchema,
  personCreditSchema,
  type PersonCredit,
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
import { reviewsInput, reviewsPageSchema, type ReviewsInput, type ReviewsPage } from './reviews';
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
import type { DirectWatchLink } from './tmdb-types/watch-provider';

// Services are supplied by the host, so the router has no app, env, or database dependencies.
export type HomeService = {
  list(input: z.infer<typeof homeListInput>): Promise<MediaCard[]>;
  trending(input: z.infer<typeof trendingInput>): Promise<MediaCard[]>;
};
export type CatalogService = PdpService &
  CatalogMetadataService & {
    resolveImdb(input: { imdbId: string }): Promise<ImdbTitle | null>;
    certification(input: CatalogDetailInput): Promise<z.infer<typeof certificationSchema>>;
    rating(input: z.infer<typeof ratingInput>): Promise<z.infer<typeof imdbRatingSchema> | null>;
    watchLinks(input: CatalogTitleInput): Promise<DirectWatchLink[]>;
    imdb(input: CatalogTitleInput): Promise<CatalogImdb>;
    reviews(input: ReviewsInput): Promise<ReviewsPage>;
    credits(input: CatalogTitleInput): Promise<CatalogCredits>;
    details(input: CatalogDetailInput): Promise<CatalogDetail>;
    trailer(input: CatalogTitleInput): Promise<Trailer>;
    providers(input: CatalogDetailInput): Promise<ProviderGroups>;
    related(input: CatalogRelatedInput): Promise<MediaCard[]>;
  };
export type DiscoveryService = {
  genres(input: { type: 'movie' | 'tv' }): Promise<z.infer<typeof genreRecordsSchema>>;
  providerCatalog(input: DiscoveryOptionsInput): Promise<z.infer<typeof providerRecordSchema>[]>;
  facets(input: DiscoveryFacetInput): Promise<DiscoveryChoice[]>;
  list(input: DiscoveryInput): Promise<DiscoveryPage>;
  options(input: DiscoveryOptionsInput): Promise<DiscoveryOptions>;
};
export type SearchService = {
  list(input: SearchInput): Promise<SearchPage>;
  suggestions(input: { query: string }): Promise<SearchPage>;
};
export type PersonService = PersonMetadataService & {
  details(input: PersonInput): Promise<PersonDetail>;
  credits(input: PersonCreditsInput): Promise<PersonCredit[]>;
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
  customLists: CustomListService;
  systemLists: SystemListService;
  preferences: PreferencesService;
  person: PersonService;
  search: SearchService;
  home: HomeService;
  catalog: CatalogService;
  discovery: DiscoveryService;
};
export type AppContext = AppServices & {
  session?: { current(): Promise<SessionUser | null> };
  onMutation?: (event: MutationEvent) => void | Promise<void>;
};
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

/** Hosts may react to validated, successful writes without inspecting HTTP paths or bodies. */
function mutationProcedure<TSchema extends z.ZodType>(
  schema: TSchema,
  effect: (input: InferSchemaOutput<TSchema>) => MutationEffect,
) {
  return authedProcedure.input(schema).use(async ({ context, next }, input) => {
    const result = await next();
    await context.onMutation?.({ ...effect(input), userId: context.user.id });
    return result;
  });
}

const customListErrors = {
  NOT_FOUND: { message: 'List or item not found' },
  CONFLICT: { message: 'Item already in list' },
};

export const appRouter = {
  customLists: {
    index: authedProcedure
      .input(customListContracts.index.input)
      .output(customListContracts.index.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.index(context.user.id, input)),
    details: authedProcedure
      .input(customListContracts.details.input)
      .output(customListContracts.details.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.details(context.user.id, input)),
    create: mutationProcedure(customListContracts.create.input, () => ({ domain: 'customLists' }))
      .output(customListContracts.create.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.create(context.user.id, input)),
    update: mutationProcedure(customListContracts.update.input, (input) => ({
      domain: 'customLists',
      listId: input.listId,
    }))
      .output(customListContracts.update.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.update(context.user.id, input)),
    delete: mutationProcedure(customListContracts.delete.input, (input) => ({
      domain: 'customLists',
      listId: input.listId,
    }))
      .output(customListContracts.delete.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.delete(context.user.id, input)),
    add: mutationProcedure(customListContracts.add.input, (input) => ({
      domain: 'customLists',
      listId: input.listId,
      resource: { resourceId: input.resourceId, resourceType: input.resourceType },
    }))
      .output(customListContracts.add.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.add(context.user.id, input)),
    remove: mutationProcedure(customListContracts.remove.input, (input) => ({
      domain: 'customLists',
      listId: input.listId,
      resource: { resourceId: input.resourceId, resourceType: input.resourceType },
    }))
      .output(customListContracts.remove.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.remove(context.user.id, input)),
    status: authedProcedure
      .input(customListContracts.status.input)
      .output(customListContracts.status.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.status(context.user.id, input)),
    move: mutationProcedure(customListContracts.move.input, (input) => ({
      domain: 'customLists',
      listId: input.listId,
    }))
      .output(customListContracts.move.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.move(context.user.id, input)),
    moveItem: mutationProcedure(customListContracts.moveItem.input, () => ({
      domain: 'customLists',
    }))
      .output(customListContracts.moveItem.output)
      .errors(customListErrors)
      .handler(({ input, context }) => context.customLists.moveItem(context.user.id, input)),
  },
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
    toggle: mutationProcedure(systemListToggleInput, (input) => ({
      domain: 'systemLists',
      listType: input.listType,
      resource: { resourceId: input.resourceId, resourceType: input.resourceType },
    }))
      .output(systemListToggleSchema)
      .handler(({ input, context }) => context.systemLists.toggle(context.user.id, input)),
    move: mutationProcedure(systemListMoveInput, (input) => ({
      domain: 'systemLists',
      listType: input.listType,
    }))
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
    setProviders: mutationProcedure(providerPreferenceSchema, () => ({ domain: 'preferences' }))
      .output(providerPreferenceSchema)
      .handler(({ input, context }) => context.preferences.setProviders(context.user.id, input)),
    providerOptions: authedProcedure
      .input(regionPreferenceSchema)
      .output(providerChoicesSchema)
      .handler(({ input, context }) => context.preferences.providerOptions(input)),
    region: authedProcedure
      .output(regionPreferenceSchema)
      .handler(({ context }) => context.preferences.region(context.user.id)),
    setRegion: mutationProcedure(regionPreferenceSchema, () => ({ domain: 'preferences' }))
      .output(regionPreferenceSchema)
      .handler(({ input, context }) => context.preferences.setRegion(context.user.id, input)),
  },
  person: {
    profile: procedure
      .input(personInput)
      .output(personMetadataSchema)
      .handler(({ input, context }) => context.person.profile(input)),
    movieCredits: procedure
      .input(personInput)
      .output(personMovieCreditsSchema)
      .handler(({ input, context }) => context.person.movieCredits(input)),
    tvCredits: procedure
      .input(personInput)
      .output(personTvCreditsSchema)
      .handler(({ input, context }) => context.person.tvCredits(input)),
    details: procedure
      .input(personInput)
      .output(personDetailSchema)
      .errors({ NOT_FOUND: { message: 'Person not found' } })
      .handler(({ input, context }) => context.person.details(input)),
    credits: procedure
      .input(personCreditsInput)
      .output(z.array(personCreditSchema))
      .handler(({ input, context }) => context.person.credits(input)),
  },
  search: {
    suggestions: procedure
      .input(searchInput.pick({ query: true }))
      .output(searchPageSchema)
      .handler(({ input, context }) => context.search.suggestions(input)),
    list: procedure
      .input(searchInput)
      .output(searchPageSchema)
      .handler(({ input, context }) => context.search.list(input)),
  },
  discovery: {
    genres: procedure
      .input(discoveryOptionsInput.pick({ type: true }))
      .output(genreRecordsSchema)
      .handler(({ input, context }) => context.discovery.genres(input)),
    providerCatalog: procedure
      .input(discoveryOptionsInput)
      .output(z.array(providerRecordSchema))
      .handler(({ input, context }) => context.discovery.providerCatalog(input)),
    facets: procedure
      .input(discoveryFacetInput)
      .output(z.array(discoveryChoice))
      .handler(({ input, context }) => context.discovery.facets(input)),
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
    movieDetails: procedure
      .input(pdpEntityInput)
      .output(movieMetadataSchema)
      .handler(({ input, context }) => context.catalog.movieDetails(input)),
    tvDetails: procedure
      .input(pdpEntityInput)
      .output(tvMetadataSchema)
      .handler(({ input, context }) => context.catalog.tvDetails(input)),
    movieCredits: procedure
      .input(pdpEntityInput)
      .output(movieCreditMetadataSchema)
      .handler(({ input, context }) => context.catalog.movieCredits(input)),
    tvCredits: procedure
      .input(pdpEntityInput)
      .output(tvCreditMetadataSchema)
      .handler(({ input, context }) => context.catalog.tvCredits(input)),
    aggregateCredits: procedure
      .input(pdpEntityInput)
      .output(aggregateCreditMetadataSchema)
      .handler(({ input, context }) => context.catalog.aggregateCredits(input)),
    availability: procedure
      .input(catalogTitleInput)
      .output(availabilitySchema)
      .handler(({ input, context }) => context.catalog.availability(input)),
    externalIds: procedure
      .input(catalogTitleInput)
      .output(externalIdsSchema)
      .handler(({ input, context }) => context.catalog.externalIds(input)),
    certification: procedure
      .input(catalogDetailInput)
      .output(certificationSchema)
      .handler(({ input, context }) => context.catalog.certification(input)),
    rating: procedure
      .input(ratingInput)
      .output(imdbRatingSchema.nullable())
      .handler(({ input, context }) => context.catalog.rating(input)),
    resolveImdb: procedure
      .input(z.object({ imdbId: imdbIdSchema }))
      .output(imdbTitleSchema.nullable())
      .handler(({ input, context }) => context.catalog.resolveImdb(input)),
    watchLinks: procedure
      .input(catalogTitleInput)
      .output(directWatchLinksSchema)
      .handler(({ input, context }) => context.catalog.watchLinks(input)),
    extras: procedure
      .input(catalogDetailInput)
      .output(pdpExtrasSchema)
      .handler(({ input, context }) => context.catalog.extras(input)),
    season: procedure
      .input(seasonInput)
      .output(seasonPageSchema)
      .handler(({ input, context }) => context.catalog.season(input)),
    collection: procedure
      .input(pdpEntityInput)
      .output(collectionPageSchema)
      .handler(({ input, context }) => context.catalog.collection(input)),
    keyword: procedure
      .input(keywordInput)
      .output(keywordPageSchema)
      .handler(({ input, context }) => context.catalog.keyword(input)),
    imdb: procedure
      .input(catalogTitleInput)
      .output(catalogImdbSchema)
      .handler(({ input, context }) => context.catalog.imdb(input)),
    reviews: procedure
      .input(reviewsInput)
      .output(reviewsPageSchema)
      .handler(({ input, context }) => context.catalog.reviews(input)),
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
