import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Everything the CLI copies into people's projects (components, blocks, pages
 * and templates) lands in apps that mostly lint with eslint-config-next. It is
 * held to the same rules here, so no copied file lands on anyone's ignore list.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: "." } },
    rules: {
      // Components are framework-free: an avatar or an image shows any URL it
      // is given, which next/image cannot do without the app's configuration.
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);
