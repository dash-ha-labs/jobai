// Server functions for JobAI Web
// Executes exclusively in Node.js server environment during SSR / RPC calls

import { createServerFn } from "@tanstack/react-start";
import type { AppConfig } from "jobai-shared";
import { cvTemplatesAsAppConfig } from "jobai-shared";

export const getConfig = createServerFn({ method: "GET" })
  .handler(async (): Promise<AppConfig> => {
    return {
      title: "JobAI — Local CV Manager",
      description: "A locally running CV management application. No data leaves your browser.",
      version: "1.0.0",
      storageVersion: "1.0.0",
      privacyNotice: "All CV data is stored exclusively in your browser's localStorage.",
      templates: cvTemplatesAsAppConfig(),
    };
  });
