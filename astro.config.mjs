import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// @ts-check
import { defineConfig } from 'astro/config';

import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://www.shannonhubbell.com",
  trailingSlash: "ignore",
  integrations: [react()],
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  // The site doesn't use Astro sessions; disabling them stops the adapter from
  // adding a SESSION KV binding that preview deploys can't provision (error 10021).
  session: false,
});