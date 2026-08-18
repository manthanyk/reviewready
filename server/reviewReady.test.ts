import { describe, expect, it } from "vitest";
import { appRouter, parsePrDescriptionContent } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("parsePrDescriptionContent", () => {
  it("accepts a response with exactly the four required sections", () => {
    const result = parsePrDescriptionContent(JSON.stringify({
      title: "feat: add pull request description generator",
      summary: "Turns a pasted git diff into a review-ready PR description.",
      changes: ["Adds a server-side generation procedure", "Adds input validation"],
      testingNotes: "Verify the generated content matches the pasted diff.",
    }));

    expect(result).toEqual({
      title: "feat: add pull request description generator",
      summary: "Turns a pasted git diff into a review-ready PR description.",
      changes: ["Adds a server-side generation procedure", "Adds input validation"],
      testingNotes: "Verify the generated content matches the pasted diff.",
    });
  });

  it("rejects a response missing testing notes", () => {
    expect(() => parsePrDescriptionContent(JSON.stringify({
      title: "feat: add pull request description generator",
      summary: "Turns a pasted git diff into a review-ready PR description.",
      changes: ["Adds a server-side generation procedure"],
    }))).toThrow();
  });

  it("normalizes common free-model aliases into the four required sections", () => {
    const result = parsePrDescriptionContent(JSON.stringify({
      description: "Add number annotations to the add helper.",
      summary: "The helper now validates parameters at compile time.",
      changes: [{ file: "src/math.ts", change: "Adds number types to both parameters" }],
      tests: "Existing math tests should continue to pass.",
    }));

    expect(result).toEqual({
      title: "Add number annotations to the add helper.",
      summary: "The helper now validates parameters at compile time.",
      changes: ["src/math.ts: Adds number types to both parameters"],
      testingNotes: "Existing math tests should continue to pass.",
    });
  });
});

describe("reviewReady.generatePrDescription", () => {
  it("rejects a diff that is too short before it reaches an AI provider", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.reviewReady.generatePrDescription({ diff: "short" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
