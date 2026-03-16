import { defineConfig } from "vitest/config";
import { vitestSetupFilePath } from "@stacks/clarinet-sdk/vitest";

// Modern Clarinet Vitest setup (no legacy environment plugin):
// - environment: "node"  
// - globals: true (so `describe`/`it`/`expect` are global)
// - setupFiles: clarinet.config.ts initializes simnet, then SDK provides helpers

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Setup files run in test environment with access to async/await
    setupFiles: ["./clarinet.config.ts", vitestSetupFilePath],
  },
});

