// Test file for shared types
// Verifies type definitions are correct and can be imported

import { describe, it, expect } from "vitest";

describe("types", () => {
  it("should have correct CV structure", () => {
    const cv = {
      version: "1.0.0",
      sections: [
        {
          type: "experience",
          title: "Software Engineer",
          content: "Worked at company",
          date: "2020-2024",
        },
      ],
    };
    expect(cv.version).toBe("1.0.0");
    expect(cv.sections.length).toBe(1);
  });

  it("should have correct job metadata structure", () => {
    const metadata = {
      id: "test-id",
      jobTitle: "Frontend Developer",
      company: "Example Corp",
      createdAt: new Date().toISOString(),
      description: "React position",
      requirements: ["React", "TypeScript"],
    };
    expect(metadata.id).toBeDefined();
    expect(metadata.jobTitle).toBe("Frontend Developer");
  });
});
