// Sets up global simnet + global.options.clarinet for Clarinet's Vitest helpers.
// Modern Clarinet SDK 3.x approach without legacy vitest-environment-clarinet.

import { initSimnet, type Simnet } from "@stacks/clarinet-sdk";
import { getClarinetVitestsArgv } from "@stacks/clarinet-sdk/vitest";

// TypeScript global type declaration
declare global {
  const simnet: Simnet;
}

const argv = await getClarinetVitestsArgv();

// Initialize the simnet instance and make it globally available
const simnetInstance = await initSimnet(argv.manifestPath);
(globalThis as any).simnet = simnetInstance;

// Set up the options object that Clarinet's Vitest setup file expects
(globalThis as any).options = {
  clarinet: {
    manifestPath: argv.manifestPath,
    initBeforeEach: argv.initBeforeEach,
    coverage: argv.coverage,
    coverageFilename: argv.coverageFilename,
    costs: argv.costs,
    costsFilename: argv.costsFilename,
    includeBootContracts: false,
    bootContractsPath: "",
  },
};

// Also initialize arrays for coverage/costs reporting
(globalThis as any).coverageReports = [];
(globalThis as any).costsReports = [];
