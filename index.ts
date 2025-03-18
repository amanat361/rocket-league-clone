import { serve } from "bun";
import homepage from "./index.html";

const server = serve({
  routes: {
    // Bundle & route index.html to "/"
    "/": homepage,
  },

  // Enable development mode for detailed error messages and hot reloading
  development: true,
});

console.log(`Rocket League Clone running at ${server.url}`);
