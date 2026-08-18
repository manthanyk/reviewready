import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, Check, Copy, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

const starterDiff = `diff --git a/src/lib/format.ts b/src/lib/format.ts
index 8c8dff1..b41d5ca 100644
--- a/src/lib/format.ts
+++ b/src/lib/format.ts
@@ -1,4 +1,8 @@
 export function formatName(name: string) {
-  return name.trim();
+  return name
+    .trim()
+    .split(" ")
+    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
+    .join(" ");
 }`;

export default function Home() {
  const [diff, setDiff] = useState("");
  const [clientError, setClientError] = useState("");
  const [copied, setCopied] = useState(false);
  const generate = trpc.reviewReady.generatePrDescription.useMutation({ onSuccess: () => setClientError("") });

  const outputText = useMemo(() => {
    if (!generate.data) return "";
    return `# ${generate.data.title}\n\n## Summary\n${generate.data.summary}\n\n## Changes\n${generate.data.changes.map(change => `- ${change}`).join("\n")}\n\n## Testing notes\n${generate.data.testingNotes}`;
  }, [generate.data]);

  const handleGenerate = () => {
    if (diff.trim().length < 10) {
      setClientError("Paste a meaningful git diff before generating.");
      return;
    }
    setClientError("");
    setCopied(false);
    generate.mutate({ diff });
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-[#111111] selection:bg-[#ef2828] selection:text-white">
      <header className="border-b border-black px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <a href="/" className="group flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
            <span className="h-4 w-4 bg-[#ef2828] transition-transform duration-150 group-hover:rotate-90" aria-hidden="true" />
            ReviewReady
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/60">Diff → Description / 01</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section className="grid border-b border-black pb-12 lg:grid-cols-12 lg:gap-x-7 lg:pb-16">
          <div className="col-span-7">
            <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-[#ef2828]">01 / Review communication, without the blank page</p>
            <h1 className="max-w-4xl text-[clamp(3.2rem,8.4vw,8.75rem)] font-bold leading-[0.82] tracking-[-0.085em]">Make every<br /><span className="relative inline-block">change</span> reviewable.</h1>
          </div>
          <div className="col-span-3 col-start-10 flex items-end pt-9 lg:pt-0">
            <p className="max-w-[28ch] border-l-2 border-[#ef2828] pl-4 text-sm leading-relaxed text-black/75">Paste a raw git diff. Receive a deliberate, structured pull request description for your reviewer.</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-12 lg:gap-x-7">
          <div className="col-span-7 border-b border-black py-8 lg:border-b-0 lg:py-12">
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"><label htmlFor="git-diff">Raw git diff</label><span>{diff.length.toLocaleString()} / 30,000</span></div>
            <textarea id="git-diff" value={diff} onChange={event => setDiff(event.target.value)} placeholder="diff --git a/src/..." className="min-h-[375px] w-full resize-y border border-black bg-white p-5 font-mono text-xs leading-6 outline-none transition-shadow placeholder:text-black/35 focus:shadow-[7px_7px_0_#ef2828]" spellCheck={false} aria-describedby="diff-help" />
            <p id="diff-help" className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-black/55">Your diff is processed by the server; no key is exposed in this interface.</p>

            {(clientError || generate.error) && <div className="mt-5 flex gap-3 border border-[#ef2828] bg-[#ef2828]/[0.07] p-4 text-sm leading-relaxed"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef2828]" aria-hidden="true" /><p>{clientError || generate.error?.message}</p></div>}

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <Button onClick={handleGenerate} disabled={generate.isPending} className="h-auto rounded-none bg-black px-5 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef2828]">
                {generate.isPending ? <Loader2 className="mr-3 h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowUpRight className="mr-3 h-4 w-4" aria-hidden="true" />} Generate PR Description.
              </Button>
              <button type="button" onClick={() => { setDiff(starterDiff); setClientError(""); }} className="group inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] underline decoration-1 underline-offset-4 transition-colors hover:text-[#ef2828]"><Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" aria-hidden="true" /> Load an example</button>
            </div>
          </div>

          <div className="col-span-5 border-l-0 py-8 lg:border-l lg:border-black lg:py-12 lg:pl-7">
            <div className="mb-4 flex items-center justify-between border-b border-black pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"><span>02 / PR description</span>{generate.data && <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 transition-colors hover:text-[#ef2828]" aria-label="Copy PR description">{copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>}</div>

            {generate.isPending ? <div className="flex min-h-[360px] flex-col justify-between border border-black bg-white p-6"><div className="h-11 w-11 animate-pulse bg-[#ef2828]" /><p className="font-mono text-xs uppercase tracking-[0.12em]">Reading the diff<br />Writing for review</p></div> : generate.data ? <article className="border border-black bg-white">
              <section className="border-b border-black p-6 sm:p-7"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ef2828]">Title</p><h2 className="text-3xl font-bold leading-[0.95] tracking-[-0.045em]">{generate.data.title}</h2></section>
              <section className="border-b border-black p-6 sm:p-7"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ef2828]">Summary</p><p className="text-sm leading-relaxed">{generate.data.summary}</p></section>
              <section className="border-b border-black p-6 sm:p-7"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ef2828]">Changes</p><ul className="space-y-2 text-sm leading-relaxed">{generate.data.changes.map((change, index) => <li key={`${change}-${index}`} className="grid grid-cols-[1.5rem_1fr] gap-2"><span className="font-mono text-[#ef2828]">{String(index + 1).padStart(2, "0")}</span><span>{change}</span></li>)}</ul></section>
              <section className="p-6 sm:p-7"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ef2828]">Testing notes</p><p className="text-sm leading-relaxed">{generate.data.testingNotes}</p></section>
            </article> : <div className="flex min-h-[360px] flex-col justify-between border border-black bg-white p-6"><span className="h-11 w-11 bg-[#ef2828]" aria-hidden="true" /><div><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">Awaiting input</p><p className="max-w-[30ch] text-sm leading-relaxed text-black/65">A structured description will appear here with the exact information a reviewer needs.</p></div></div>}
          </div>
        </section>
      </main>

      <footer className="border-t border-black px-5 py-4 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-black/60"><span>ReviewReady</span><span>Built for deliberate review</span></div></footer>
    </div>
  );
}
