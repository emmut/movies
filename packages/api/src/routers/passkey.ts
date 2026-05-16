import { auth } from "@movies/auth";

import { protectedProcedure } from "../index";

export const passkeyRouter = {
  list: protectedProcedure.handler(async ({ context }) => {
    try {
      const response = await auth.api.listPasskeys({
        headers: new Headers(),
        // @ts-expect-error session is injected at the handler-call site
        session: context.session,
      });
      return response || [];
    } catch (error) {
      console.error("Failed to fetch user passkeys:", error);
      return [];
    }
  }),
};
