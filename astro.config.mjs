import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// @ts-check
import { defineConfig } from 'astro/config';

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://www.shannonhubbell.com",
  trailingSlash: "ignore",
  integrations: [react()]
});                