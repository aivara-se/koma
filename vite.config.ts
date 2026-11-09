import { fileURLToPath } from "node:url";
import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// Koma is a single-user studio with a SQLite file and an image directory on
// disk, so it ships as a Node server rather than static files.
export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({ out: "build" }),
      // The studio has no accounts: the only authority is the person at the
      // machine, so a forged form post gains nothing that a direct request
      // does not. It also lets one build answer on localhost, a tunnel and a
      // private host without baking an origin in.
      csrf: { trustedOrigins: ["*"] },
    }),
  ],
  resolve: {
    alias: { $lib: fileURLToPath(new URL("./src/lib", import.meta.url)) },
  },
  server: { port: 5173, host: "127.0.0.1" },
});
