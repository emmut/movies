import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_BASE_URL: z.url(),
    VITE_IMGPROXY_ENDPOINT: z.url().optional(),
    VITE_IMGPROXY_BASE_URL: z.url().optional(),
    VITE_POSTHOG_KEY: z.string().min(1).optional(),
    VITE_POSTHOG_HOST: z.string().min(1).optional(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
