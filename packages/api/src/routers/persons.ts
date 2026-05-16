import { z } from "zod";

import { publicProcedure } from "../index";
import { getPersonDetails, getPersonMovieCredits, getPersonTvCredits } from "../lib/persons";

const personIdInput = z.object({ personId: z.number().int().positive() });

export const personsRouter = {
  details: publicProcedure.input(personIdInput).handler(({ input }) => getPersonDetails(input.personId)),
  movieCredits: publicProcedure
    .input(personIdInput)
    .handler(({ input }) => getPersonMovieCredits(input.personId)),
  tvCredits: publicProcedure
    .input(personIdInput)
    .handler(({ input }) => getPersonTvCredits(input.personId)),
};
