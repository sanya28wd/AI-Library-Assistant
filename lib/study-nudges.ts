import { Question } from "@/lib/types";

const authoredNudges: Record<string, readonly string[]> = {
  "q-5": [
    "Start with a workplace example. What quantities would you need to describe what is produced and what the worker receives?",
    "Keep revenue, production costs and wages separate in your example. Which distinction does your explanation need to make?",
    "Check whether your example explains both the concept and why it matters. What assumption could someone challenge?"
  ],
  "q-6": [
    "Underline the condition the question says is necessary for equality. How does that differ from changing individual attitudes?",
    "Compare what each tradition treats as the main source of inequality. Write a reason to rule out one option.",
    "Test your remaining choice against every word of the question. What evidence from your course reading would support it?"
  ],
  "d-4": [
    "A subsequence can skip characters but must preserve order. Try a small pair of prefixes before using the full strings.",
    "What should a table entry for two prefixes represent? Separate the cases where their last characters match and differ.",
    "Check your boundary cases, then trace a small table by hand. How will you reconstruct a sequence without assuming it is unique?"
  ],
  "d-9": [
    "Open the source page to see the graph. At an intermediate step, which vertices are already in your tree?",
    "Compare edges crossing from your current tree to vertices outside it. What must stay true after each choice?",
    "Trace your arrays after one step before continuing. At the end, check connectivity and the number of edges before adding the weights."
  ]
};

/** Reflection prompts intentionally avoid the answer key and generated solutions. */
export function nudgesForQuestion(question: Question): readonly string[] {
  const authored = authoredNudges[question.id];
  if (authored) return authored;
  return [
    "Restate the task in your own words. Which facts are given, what must you find, and is any data or diagram only on the source page?",
    question.options
      ? "Compare two options and write a reason to eliminate one. Which definition or counterexample would distinguish them?"
      : "Break the task into smaller steps. Which course definition or method could justify your first step, and why does it apply?",
    "Check your reasoning with a small example or counterexample. What assumption could fail, and what source evidence supports your conclusion?"
  ];
}
