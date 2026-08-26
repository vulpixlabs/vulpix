"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS: [string, string][] = [
  [
    "What is Vulpix?",
    "The live front door to the open frontier, every model, dataset and weight indexed the moment it ships, plus a playground to chat and an arena to rank. Search, filter, prove, one place.",
  ],
  [
    "Is the data live?",
    "Yes. Cards, counts, files, all streamed from upstream at request time. No snapshots, no stale stats. If it shipped, it's here.",
  ],
  [
    "Do I need an account?",
    "No. Browse, search, filter, preview and download, free, no sign-up. Playground uses your key; the mock arena is open to all.",
  ],
  [
    "How does search work?",
    "Command-K bar with live suggestions ranked by downloads. Hit Enter for full results, then narrow by task, library, license, language or size, every combo is a shareable URL.",
  ],
  [
    "What does Base only do?",
    "Hides fine-tunes, quantizations and merges, shows foundations only. Same taxonomy upstream uses. Toggle off to see the whole ecosystem.",
  ],
  [
    "How do downloads work?",
    "Open any model → Files & versions. Grab single weights or sharded sets via CDN, or copy the one-line hf download command.",
  ],
  [
    "Can I run a model without setup?",
    "Yes. Use Open in Colab, Open in Kaggle, or chat live in the playground, no local GPU needed.",
  ],
  [
    "How is this different from the upstream index?",
    "Same live data, different discipline. Minimal, brutalist-fast UI, smarter filters, modality search, playground + arena, the front door, not the warehouse.",
  ],
];

export function Faq() {
  return (
    <section
      data-trail="dark"
      className="relative border-b-2 border-ink bg-exotic py-20 text-paper md:py-28"
    >
      <div className="mx-auto w-full max-w-[900px] px-6">
        <p className="label mb-3 text-paper/70">FAQ</p>
        <h2 className="font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02]">
          Questions, answered<span className="text-ink">.</span>
        </h2>
        <p className="mt-4 max-w-xl text-paper/80">
          Everything you need to know about the index, the data and the
          workflow, in eight short answers.
        </p>

        <Accordion
          type="single"
          collapsible
          className="mt-10 border-t-2 border-paper/30"
        >
          {FAQS.map(([q, a], i) => (
            <AccordionItem
              key={q}
              value={`faq-${i}`}
              className="border-b-2 border-paper/30"
            >
              <AccordionTrigger className="py-5 text-left font-sans text-base font-bold text-paper hover:no-underline hover:text-paper data-[state=open]:text-paper [&>svg]:text-paper [&[data-state=open]>svg]:rotate-180">
                {q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-base leading-relaxed text-paper/85">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
