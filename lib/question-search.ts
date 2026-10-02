import { assessmentOf, topicForId, topics } from "@/lib/seed";
import { AssessmentType, Question } from "@/lib/types";

const searchStopwords = new Set("a an the and or of to in on for with is are was were what which how explain find show give me question questions about past paper papers please".split(" "));

function normalizeSearch(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[’']s\b/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

function searchTerms(text: string): string[] {
  return [...new Set(normalizeSearch(text).split(" ").filter((term) => term && !searchStopwords.has(term)))];
}

/** Return every matching curated question; text ranks before topic aliases. */
// ponytail: lexical ranking cannot understand unseen paraphrases; benchmark hybrid retrieval when aliases fall short.
export function searchQuestions(bank: Question[], query: string, topicIds: string[], assessments: AssessmentType[]): Question[] {
  const normalized = normalizeSearch(query);
  const terms = searchTerms(query);
  const matchedTopics = topics.filter((topic) => [topic.name, ...topic.keywords].some((alias) => {
    const phrase = normalizeSearch(alias);
    return phrase.length > 0 && ` ${normalized} `.includes(` ${phrase} `);
  })).map((topic) => topic.id);

  return bank.filter((question) => {
    const assessment = assessmentOf(question);
    return (topicIds.length === 0 || topicIds.some((id) => question.topicIds.includes(id)))
      && (assessments.length === 0 || (assessment !== null && assessments.includes(assessment)));
  }).map((question) => {
    const text = normalizeSearch([question.text, ...(question.options ?? []), ...(question.visuals ?? []).map((visual) => `${visual.caption} ${visual.description}`)].join(" "));
    const textTerms = new Set(searchTerms(text));
    const topicText = searchTerms(question.topicIds.map((id) => {
      const topic = topicForId(id);
      return topic ? [topic.name, ...topic.keywords].join(" ") : "";
    }).join(" "));
    const topicTerms = new Set(topicText);
    const textHits = terms.filter((term) => textTerms.has(term)).length;
    const allTermsMatch = terms.length > 0 && terms.every((term) => textTerms.has(term) || topicTerms.has(term));
    const aliasMatch = question.topicIds.some((id) => matchedTopics.includes(id));
    const phraseMatch = normalized.length > 0 && ` ${text} `.includes(` ${normalized} `);
    const score = (phraseMatch ? 100 : 0) + textHits * 5 + (allTermsMatch ? 3 : 0) + (aliasMatch ? 1 : 0);
    return { question, score, matches: normalized.length === 0 || allTermsMatch || aliasMatch || phraseMatch };
  }).filter((result) => result.matches).sort((a, b) => b.score - a.score).map((result) => result.question);
}
