import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fullFaqs } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about the colour analysis, privacy, and results.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        Frequently asked questions
      </h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        Straight answers about what the system does, what it deliberately does not do, and how your
        data is handled.
      </p>
      <Accordion className="mt-8">
        {fullFaqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
