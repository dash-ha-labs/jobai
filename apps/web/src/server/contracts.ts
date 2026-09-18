// Server functions for JobAI Web
// Executes exclusively in Node.js server environment during SSR / RPC calls

import { createServerFn } from "@tanstack/react-start";
import type { AppConfig } from "jobai-shared";

export const getConfig = createServerFn({ method: "GET" })
  .handler(async (): Promise<AppConfig> => {
    return {
      title: "JobAI — Local CV Manager",
      description: "A locally running CV management application. No data leaves your browser.",
      version: "1.0.0",
      storageVersion: "1.0.0",
      privacyNotice: "All CV data is stored exclusively in your browser's localStorage.",
      templates: [
        { id: "modern", name: "Modern Clean", description: "Minimalist layout with clear visual hierarchy and accent header" },
        { id: "executive", name: "Executive", description: "Structured traditional corporate layout optimized for leadership roles" },
        { id: "tech", name: "Technical", description: "Skills and project focused layout designed for engineering resumes" },
        { id: "compact", name: "Compact", description: "Dense single-page layout maximizing content per square inch" },
      ],
    };
  });
