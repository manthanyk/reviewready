# ReviewReady

## The Problem

Writing a pull request description after completing a small change often creates a second, unrelated task: reconstructing what changed, deciding what a reviewer needs to know, and remembering which tests still need attention. The specific friction ReviewReady addresses is turning a raw `git diff` into a concise description that lets a reviewer understand the change without reverse-engineering every line. This is useful for individual developers and teams that want each pull request to begin with the same review-oriented context rather than a vague “updated code” summary.

## What It Does

The user pastes a raw git diff into a single textarea and selects **Generate PR Description.** The backend analyzes the diff and returns exactly four rendered sections: a **title**, **summary**, **changes** list, and **testing notes**. The output can be copied as Markdown for direct use in a pull request. Without the AI transformation, the user would need to manually read the diff and compose each of those reviewer-facing sections.

## AI Integration

**API:** OpenRouter Free Models Router, with a no-key LLM7 anonymous turbo fallback when the free router is unavailable.

**Model:** `openrouter/free` is the primary route. The verified fallback is `DeepSeek-V4-Flash-0731`, an LLM7 turbo model that supports JSON-mode output. OpenRouter documents that its Free Models Router selects an available free model and does not charge for routed free-model requests; LLM7 documents turbo access for anonymous and free-token users. [OpenRouter Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free-router) [LLM7 models](https://docs.llm7.io/guides/models)

**Location:** The AI calls live only in `server/routers.ts`, inside the `generatePrDescription()` function. The frontend calls the application’s own `reviewReady.generatePrDescription` tRPC procedure and contains no AI-provider URL or key.

**What the AI does:** It converts a raw code diff into structured review context, then server-side validation normalizes the response into the four required output sections.

## What I Intentionally Excluded

- **User accounts and saved history:** The tool is session-based because authentication and persistence would slow delivery without improving the core paste → description workflow.
- **Repository integrations:** GitHub installation and automatic diff imports are intentionally excluded because they require OAuth scopes and permission review; pasting a diff keeps the first version focused and transparent.
- **Editable AI prompts and model picker:** Free-model availability changes and exposing model controls would create unnecessary support complexity. The backend owns a safe free-route fallback instead.

## Monthly Cost Calculation

Primary model route: `openrouter/free`.

Input token rate: **$0.00 per 1M tokens** for calls routed through OpenRouter’s Free Models Router.

Output token rate: **$0.00 per 1M tokens** for calls routed through OpenRouter’s Free Models Router.

Average tokens per call: **~600 input + ~400 output**.

Cost per call: `(600 / 1,000,000 × $0.00) + (400 / 1,000,000 × $0.00) = $0.000000 + $0.000000 = $0.000000`.

Expected monthly calls: **300**.

**Monthly total: `300 × $0.000000 = $0.00/month`.** The fallback is limited to anonymous/free turbo access and is used only when the primary zero-cost route cannot serve the request; it does not require a funded user balance. [OpenRouter pricing and limits](https://openrouter.ai/docs/guides/routing/routers/free-router) [LLM7 access tiers](https://docs.llm7.io/guides/models)

## Live Deployment

**Frontend:** [ReviewReady live URL](https://3000-ilibkd1qzjvibgumn0fbs-abbe9b7d.us4.manus.computer)

**Backend:** [ReviewReady health endpoint](https://3000-ilibkd1qzjvibgumn0fbs-abbe9b7d.us4.manus.computer/api/health)
