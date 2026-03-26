import { defineConfig } from "oxfmt";

export default defineConfig({
  singleQuote: true,
  jsxSingleQuote: false,
  ignorePatterns: [],
  sortTailwindcss: {
    stylesheet: "./src/app/globals.css",
    functions: ["cn", "clsx"],
  },
});
