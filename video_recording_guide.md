# ReviewReady — Camera-On Recording Guide

Record this as a **single, genuine, approximately three-minute screen-and-camera walkthrough**. Keep your camera visible throughout and show the running application and real code; do not use slides or an AI-generated stand-in. Speak in your own words rather than reading the wording below verbatim.

| Time | Show on screen | Explain in your own words |
| --- | --- | --- |
| 0:00–0:15 | The live ReviewReady page | State the specific problem: writing a useful PR description after a change means manually reconstructing reviewer context from the raw diff. |
| 0:15–1:30 | Paste a genuine diff, then select **Generate PR Description.** | Explain the input → output transformation. Point out the generated **title**, **summary**, **changes**, and **testing notes**, then use the copy control. State that this turns a raw diff into review-ready context. |
| 1:30–2:30 | `server/routers.ts` | Explain one piece of code you own. A strong choice is `parsePrDescriptionContent()`: it validates the four-section contract and maps common free-model aliases into that exact shape. Explain why this exists: free models may label equivalent fields differently, but the UI must remain predictable for reviewers. |
| 2:30–3:00 | `server/routers.ts` provider-routing block, or `client/src/pages/Home.tsx` | Identify a piece of AI-assisted code. Confirm that you understand it: the backend owns provider calls, the frontend only calls tRPC, and this prevents exposing API keys or AI-provider URLs in browser code. |

Before recording, verify that the browser page and code editor are readable at your screen resolution. Use the public PR page as a backup reference, but keep the focus on the live application. After recording, upload the genuine video file here or provide its Google Drive link so its sharing can be set to **Anyone with the link can view**.
