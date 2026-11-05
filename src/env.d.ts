/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime;

declare namespace App {
  interface Locals extends Runtime {
    cloudflare: {
      env: {
        DB: import("@cloudflare/workers-types").D1Database; // Example: D1
        MY_KV: import("@cloudflare/workers-types").KVNamespace; // Example: KV
        TURNSTILE_SECRET_KEY: string;
      };
    };
  }
}
