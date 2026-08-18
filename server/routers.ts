import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const MAX_DIFF_LENGTH = 30_000;
const SYSTEM_PROMPT = "You are a meticulous software engineer writing pull request descriptions. Analyze only the supplied git diff. Return the requested JSON with exactly the defined fields. Do not invent changes or tests that are not supported by the diff.";

export const prDescriptionSchema = z.object({
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(1_200),
  changes: z.array(z.string().min(1).max(320)).min(1).max(8),
  testingNotes: z.string().min(1).max(1_200),
});

export type PrDescription = z.infer<typeof prDescriptionSchema>;

export function parsePrDescriptionContent(content: string): PrDescription {
  const normalized = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  const parsed: unknown = JSON.parse(normalized);
  const exactResult = prDescriptionSchema.safeParse(parsed);
  if (exactResult.success) return exactResult.data;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The model did not return an object.");
  }

  const record = parsed as Record<string, unknown>;
  const asText = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
  const extractedChanges = Array.isArray(record.changes)
    ? record.changes.map(change => {
        if (typeof change === "string") return change.trim();
        if (change && typeof change === "object" && !Array.isArray(change)) {
          const entry = change as Record<string, unknown>;
          const file = asText(entry.file);
          const detail = asText(entry.change) ?? asText(entry.description);
          return file && detail ? `${file}: ${detail}` : detail ?? file ?? "";
        }
        return "";
      }).filter(Boolean)
    : [];
  const changes = extractedChanges.length > 0
    ? extractedChanges
    : [asText(record.summary) ?? asText(record.description)].filter((value): value is string => Boolean(value));
  const summary = asText(record.summary) ?? asText(record.description) ?? asText(record.impact);
  const title = asText(record.title) ?? asText(record.description) ?? summary ?? changes[0];
  const testingNotes = asText(record.testingNotes) ?? asText(record.tests) ?? asText(record.testing) ?? asText(record.impact) ?? "The AI did not provide explicit testing notes for this diff.";

  return prDescriptionSchema.parse({
    title,
    summary,
    changes,
    testingNotes,
  });
}

const prDescriptionResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "pull_request_description",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "A concise imperative pull request title, 72 characters or fewer." },
        summary: { type: "string", description: "A brief review-oriented summary of the change." },
        changes: { type: "array", description: "One to eight specific changes derived from the diff.", items: { type: "string" } },
        testingNotes: { type: "string", description: "Testing performed or clear testing recommendations inferred from the diff." },
      },
      required: ["title", "summary", "changes", "testingNotes"],
      additionalProperties: false,
    },
  },
};

async function requestDescription(url: string, init: RequestInit): Promise<PrDescription | undefined> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      console.warn("[ReviewReady] AI provider request failed", { host: new URL(url).host, status: response.status });
      return undefined;
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[ReviewReady] AI provider returned no message content", { host: new URL(url).host });
      return undefined;
    }
    return parsePrDescriptionContent(content);
  } catch (error) {
    console.warn("[ReviewReady] AI provider response could not be used", { host: new URL(url).host, error: error instanceof Error ? error.message : "unknown" });
    return undefined;
  }
}

async function generatePrDescription(diff: string): Promise<PrDescription> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Create a review-ready PR description for this git diff:\n\n${diff}` },
  ];
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    const openRouterResult = await requestDescription("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openrouter/free", messages, response_format: prDescriptionResponseFormat }),
    });
    if (openRouterResult) return openRouterResult;
  }

  const fallbackPrompt = `${SYSTEM_PROMPT}\n\nReturn valid JSON only, with this exact shape and no markdown fence:\n{"title":"string","summary":"string","changes":["string"],"testingNotes":"string"}\n\nGit diff:\n${diff}`;
  const anonymousFreeResult = await requestDescription("https://api.llm7.io/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "DeepSeek-V4-Flash-0731",
      messages: [{ role: "user", content: fallbackPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 900,
    }),
  });
  if (anonymousFreeResult) return anonymousFreeResult;

  throw new TRPCError({
    code: "BAD_GATEWAY",
    message: "The free AI service is temporarily unavailable. Please wait a minute and try again.",
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  reviewReady: router({
    generatePrDescription: publicProcedure
      .input(z.object({
        diff: z.string().trim().min(10, "Paste a git diff before generating.").max(MAX_DIFF_LENGTH, `Keep the diff below ${MAX_DIFF_LENGTH.toLocaleString()} characters.`),
      }))
      .mutation(async ({ input }) => generatePrDescription(input.diff)),
  }),
});

export type AppRouter = typeof appRouter;
