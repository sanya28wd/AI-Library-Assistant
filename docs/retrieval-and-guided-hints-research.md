# Retrieval and guided hints for the AI Library Assistant

Research date: 2 October 2026. Repository inspected at `e5e4971425d2c5064da5f2bf0025c542afdef12b`. This report describes that baseline; implementation changes made alongside the research need their own validation. External evidence comes from primary research papers, author publications, official documentation, and first-party source code. Proposed thresholds and designs below are product decisions, not published benchmark results.

## Recommendation

Improve the searchable corpus and question boundaries before buying a stronger model. Use one question retrieval function for the library, API, and practice selection; retain a distinct source-passage retriever for grounded tutoring. Start with reviewed topic aliases, complete question records, lexical ranking, and exact metadata filters. Benchmark dense retrieval plus reciprocal rank fusion (RRF), then a reranker, only after the first stage has a measurable baseline.

Add a progressive hint panel directly to each question card. Start with instructor-reviewed, question-specific hints and a place for the learner's attempt. Escalate from a reflective question to a strategy cue and one unfinished step. A hint should never silently become a complete answer. A verified answer remains a separate, deliberate reveal after practice.

No retrieval method guarantees all relevant information for arbitrary natural-language requests. Exact enumeration can guarantee that every *indexed, approved record satisfying explicit filters* is included, subject to correct data and pagination. Semantic relevance, extraction completeness, diagram interpretation, and learning outcomes require measurement.

## What the current repository actually does

| Layer | Observed baseline | Consequence |
|---|---|---|
| Question library | `components/QuestionSearch.tsx` and `app/api/questions/route.ts` independently use whole-query substring matching over seeded question text and topic names. | Paraphrases and combinations of terms can miss an otherwise relevant question; client and API behavior can drift. |
| Corpus | `lib/seed.ts` contains 32 curated questions; CS F364 records explicitly say they condense source questions. | Matching every seed record is not equivalent to covering every question in every paper. Graphs, tables, shared stems, and some subparts remain outside the record. |
| Source chat | `lib/retrieval.ts` reads the ingestion catalogue, chunks each page by paragraphs around 900 characters, and returns six BM25-like lexical results with phrase boosts. | Better than substring matching for passages, but separate from question search; chunking is not question segmentation and cannot join cross-page evidence. |
| Token handling | Passage tokenization drops tokens of length two or less and strips suffixes with a hand-written rule. | `DP`, `NP`, variable names, and some mathematical notation disappear; word collisions need an explicit regression case. |
| Publication boundary | Passage index selects paper, answer-key, and handout kinds, with no publication-status predicate in `buildIndex`. | Review material can enter chat if it has a matching catalogue and material record; question/hint search needs consistent reviewed-only eligibility. |
| Ingestion | `scripts/ingest-materials.ts` preserves PDF page strings, uses raw DOCX text, and OCRs pages with fewer than 40 extracted characters using Tesseract on macOS. | A partly readable but badly ordered or corrupted page may pass the character heuristic. OCR output retains text but no confidence/bounding boxes. |
| Database | Supabase migration contains question/page vector columns but the runtime question search is seeded data. | A schema is not a deployed embedding index or proof of hybrid retrieval. It also lacks the runtime `Test` assessment enum and campus/section representation. |
| Learning | `QuestionCard` exposes explanation/answer content; chat allows answer keys and general explanations. The explanation API uses question and topic names, not retrieved course evidence. | A hint feature alone does not change the existing answer-first routes; generated guidance must distinguish a question from evidence for its solution. |
| Hosting | README specifies static GitHub Pages without API routes. | Browser-side reviewed hints and deterministic question ranking fit that demo; live generative tutoring requires a server deployment. |

The generated catalogue currently contains 25 files and 175 PDF page entries, with zero `requiresOcr` flags. That establishes only that the character-count heuristic found no remaining short-text pages; it does not establish correct mathematical extraction, reading order, or complete question coverage. The seeded bank contains 10 GS F211 and 22 CS F364 questions.

These findings are supported by the named repository files and generated catalogue, not an external research claim. No ingestion audit, relevance annotation study, or student learning experiment has established current recall.

## Evidence and its limits

| Method | Primary evidence | What it supports here; what it does not establish |
|---|---|---|
| Lexical baseline | [BEIR, Thakur et al., 2021](https://arxiv.org/abs/2104.08663) compares retrieval architectures across 18 heterogeneous datasets. BM25 is a robust zero-shot baseline; reranking and late interaction have strong average performance with higher computational costs. | Keep lexical retrieval in an exam corpus with technical terms and names. BEIR does not identify the best model for these two courses. |
| Hybrid rank fusion | [Cormack, Clarke and Buettcher, SIGIR 2009](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf) evaluates RRF for combining ranked results. | Fuse complementary lexical and dense lists without treating their raw scores as comparable probabilities. Reported gains are benchmark-specific. |
| Existing database fit | [Supabase hybrid-search guide](https://supabase.com/docs/guides/ai/hybrid-search) demonstrates PostgreSQL full-text search plus pgvector and RRF. | A credible path using the repository's database choice; its example limits are illustrative and must not define an exhaustive question list. PostgreSQL `ts_rank`/`ts_rank_cd` are not BM25. |
| Metadata and vector filtering | [pgvector source documentation](https://github.com/pgvector/pgvector#filtering) explains exact filtered search and the reduced result count possible when filtering approximate-index candidates; iterative scans have explicit limits. | Prefer exact scoped search for a small course corpus. ANN settings can reduce recall and must be tested against exact results. |
| Reranking | [Sentence Transformers retrieve/rerank documentation](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html) distinguishes fast candidate retrieval from cross-encoder scoring of query–document pairs. | Rerank an adequately broad candidate set. A reranker cannot recover a question missing from that set. |
| Layout-aware extraction | [Microsoft Document Intelligence layout documentation](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout?view=doc-intel-4.0.0) describes word confidence, polygons, tables/cells, figures, and structured output. | Preserve layout and refer back to page regions when a question depends on a table or figure. These are service capabilities, not evidence that its OCR is best for this corpus. |
| Visual retrieval | [ColPali, Faysse et al., 2024/ICLR 2025](https://arxiv.org/abs/2407.01449) introduces page-image multi-vector retrieval and the ViDoRe benchmark. | A measured option when text extraction loses diagrams or layout. It returns pages, not automatically complete question/subpart records; it adds model/storage complexity. |
| Query expansion | [HyDE, Gao et al., ACL 2023](https://aclanthology.org/2023.acl-long.99/) generates a hypothetical document, embeds it, then retrieves real documents. | A later experiment for vague queries. Generated hypothetical content is neither course evidence nor a hint; it may introduce unsupported terminology. |
| Context selection | [Lost in the Middle, Liu et al., TACL 2024](https://aclanthology.org/2024.tacl-1.9/) finds position-dependent performance in studied long-context tasks. | Do not assume that feeding every PDF to an LLM solves retrieval. Preserve relevant structured context and test the actual model; the study is not a universal result for all current models. |
| AI learning guardrails | [Bastani et al., author manuscript](https://hamsabastani.github.io/education_llm.pdf) reports a field experiment with nearly 1,000 high-school mathematics students. Unrestricted GPT assistance improved assisted practice but reduced subsequent unaided grades by 17% relative to control. A tutor using teacher-designed guidance largely mitigated that harm; its unaided outcome was statistically indistinguishable from control. | Prefer constrained hints grounded in reviewed pedagogy. This is not proof that an arbitrary Socratic prompt improves university critical thinking or delayed retention. |
| Self-explanation | [Aleven and Koedinger, Cognitive Science 2002](https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog2602_1) reports two classroom Cognitive Tutor experiments where explaining steps supported understanding and transfer. | Ask learners to justify a choice or explain the next step. The evidence concerns a particular tutoring environment, not this UI. |
| Assistance balance | [Koedinger and Aleven, Educational Psychology Review 2007, author abstract](https://eric.ed.gov/?id=EJ785065) identifies the assistance dilemma: how much information to give or withhold remains context-dependent. | Avoid both immediate solutions and indefinite vague questioning; adapt help to the learner's stated impasse. A fixed three-level ladder is a practical proposal, not a proven optimum. |

## Retrieve the right unit

### 1. Inventory and extraction coverage

Maintain one row per source file and page with stable file hash, page number, extraction method, review state, and explicit failure reason. Compare registered `materials` against actual catalogue entries and source files. Record blank/unreadable pages, duplicated files, and papers bundled into multiple assessment sections. Do not count an answer-key page as a question-paper question.

For this pilot, manually reconcile each paper's question count and subparts against the indexed corpus. A stronger encoder cannot recover an unindexed question. Keep extracted text separate from approved text and keep exact source provenance after corrections.

Retain Tesseract/text extraction for pages it handles well. Inspect math-heavy, multi-column, diagram-heavy, and mixed-scan pages rather than trusting a character-count threshold. If failures are material, compare a layout parser on a representative audited subset, scoring numbers, signs, labels, tables, and reading order. The Microsoft layout capabilities above make this possible; adopting that vendor is not required.

### 2. Question and subpart records

Use a question as the library result, not a random paragraph. A complete record needs stable source identity, question number, exact stem, options, marks when known, subparts, shared instructions, page span, and required tables/figures. Keep condensed summaries as optional search text, never as a replacement for the exam statement.

Index a child subpart with its parent stem; after retrieving the child, expand to the full parent and required assets. A page break must not sever an instruction from the numerical data it refers to. Avoid a blanket token overlap policy as the only cure: it cannot reliably reconstruct question ownership. This design is an inference from the repository's missing structure and the layout evidence, not an experimentally established chunk size.

For paper discovery, use paper records and section metadata. For question discovery, use question records. For hints, retrieve approved conceptual excerpts or reviewed hint material tied to the selected question. These are different result units with different completeness requirements.

### 3. Filtering versus ranking

Hard filters should be explicit: course, campus, year/session, assessment section, publication state, and selected approved topics. Apply the same eligible corpus to both retrieval branches. A semantic similarity score must never override course/campus restrictions. Topic chips use relational tags to enumerate all approved matches; leave assessment unconstrained by default to retain the existing cross-exam revision behavior.

Distinguish these requests:

- **“All reviewed dynamic programming questions, Dubai, 2024.”** Enumerate matching indexed records with a total count and complete pagination. No top-k truncation, no semantic threshold masquerading as exhaustive recall.
- **“Questions about remembering earlier results instead of recalculating.”** Rank lexical/topic-alias/dense candidates; disclose that this is relevance search, and offer the corresponding approved topic filter.
- **“Explain how I should begin question d-3.”** Anchor to d-3, its exact stem/data, and the current learner attempt. Do not perform broad retrieval of generic answer keys.

Multiple selected topics currently mean OR. Keep that visible and deliberate; if an AND mode is later requested, expose it explicitly. For multi-concept natural-language requests, retrieve per concept and merge rather than allowing one frequently mentioned topic to consume the entire evidence budget. Show which source question supports which requested concept.

## Ranking architecture and upgrade decisions

### Minimal first stage

Reuse reviewed `Topic.keywords` to recognize abbreviations, spelling variants, and common conceptual names. Preserve short domain terms (`DP`, `NP`, `LP`), Unicode apostrophes, and mathematical notation in source text. Normalize only a separate search representation. Avoid hand-written suffix stripping that changes unrelated words into misleading matches.

Move duplicated client/API question eligibility and ranking into a pure shared function, accepting explicit filters. Score exact phrase, individual terms, question text, approved topic names, and aliases transparently. This can run in the static app without new infrastructure. Call it lexical/topic-assisted retrieval; do not label it semantic embeddings or validated BM25 unless that implementation and its measurements exist.

### Hybrid candidate retrieval when measured necessary

If paraphrase failures remain, embed complete question/subpart units with a consistent model and vector dimension. Preserve original user terms and identifiers. Retrieve lexical and dense candidates from the same filtered corpus, deduplicate by stable question/subpart ID, and fuse:

`RRF(d) = sum over retrieval lists of weight / (k + rank(d))`

Starting experiments can compare candidate budgets of 20/50/100 and RRF `k` around 50–60. These are tuning candidates, not correctness constants. Compare exact vector search before introducing approximate indexing. Supabase's guide provides an implementation pattern; pgvector documents the filtering pitfalls.

Consider cross-encoder reranking only if relevant questions are already in the candidate set but ranked poorly. Benchmark latency/cost against a lexical-only and hybrid-only ablation. Preserve parent expansion and topic coverage after reranking; do not silently convert a complete filtered library listing into a five-result answer context.

### Defer until a demonstrated failure

| Option | Add when | Reason to defer |
|---|---|---|
| Visual page retriever such as ColPali | Audited failures concentrate on diagrams/layout that remain inaccessible through good extraction and attached page images. | Page-level model does not remove question segmentation or review work. |
| HyDE / model query rewrite | Held-out vague-query recall remains poor after aliases and hybrid retrieval. | Extra generation, cost, hallucinated expansion, and possible drift from exact query constraints. |
| Fine-tuned embeddings/reranker | A sufficient annotated local dataset shows consistent domain errors and a held-out benefit. | No relevance dataset currently establishes the need. |
| Knowledge graph / agentic search | Repeated measured multi-hop failures require relationships absent from relational question/source metadata. | Most pilot needs are direct question retrieval and metadata filtering. |

## Guided hints on the library page

Put “Get a hint” within `QuestionCard`, with a compact expandable panel below the selected question and an optional “What have you tried?” field. Keep source paper/page access beside it. Make the hint usable without leaving the library or opening a general AI chat.

Suggested progression, to be reviewed against each question:

1. **Orient:** ask the learner to identify givens, the requested result, or a relevant distinction.
2. **Strategy:** name a useful approach and ask the learner to explain why it fits, without performing the application.
3. **Next step:** offer one partial setup or a diagnostic question addressing the reported misconception; leave the actual question-specific work unfinished.

For the existing knapsack question, an author might ask first what the capacity constrains, then which state would represent the first i items, then which two choices need comparing for the next item. No optimal subset or completed table belongs in that ladder. For political concepts, ask the learner to contrast premises, choose a supporting argument, and identify a possible counterargument; avoid a ready-to-submit essay. These are design examples, not claims extracted from an answer key.

Start with reviewed static hints tied to individual question IDs. They work on GitHub Pages and put a human in control of answer leakage. If a question has no reviewed hint, state that clearly; do not display a generic topic sentence as though it were a source-grounded question-specific hint. A generic attempt-first reflection prompt is an acceptable bounded pilot when labeled as such; it should not imply an instructor has verified the learner's strategy or solution. Creating all hints is substantive authoring work, not something a broad template establishes automatically.

A later generated-hint endpoint should accept a validated question ID, an explicit level, and a bounded learner attempt. It should retrieve the exact question plus approved conceptual evidence, enforce reviewed-only eligibility, and return a small typed result: hint, next reflective question, and source references. Validate the server-side level and source IDs. Separate question-paper text from solution evidence: the existence of an exam question does not prove a definition or solution.

Where reviewed teacher notes contain a solution, the server may use them to judge guidance, but returning them to the hint client defeats the boundary. Prefer vetted hint content over arbitrary answer-key excerpts. Prompt constraints alone do not guarantee non-disclosure: test direct answer requests, role-play overrides, requests for the correct MCQ option, repeated escalation, and attempts to retrieve solution excerpts via other endpoints. Keep answer reveal visibly separate; don't claim the system prevents answers while chat or the source PDF still permits them.

Keyboard access, an accessible label on the attempt field, announced loading/errors, and focus-preserving expansion are part of the feature. Keep attempts local/session-scoped for the pilot unless the product explicitly chooses persistence; logging should record IDs, levels, timings and error categories rather than student text by default.

## Evaluation that can establish improvement

Create one small, runnable retrieval smoke check and a reviewed fixture dataset rather than adding a large test framework. Build an initial 60–100 query set, stratified across both courses and assessments; reserve approximately one third as a held-out set and split by source paper where possible. Numbers are proposed starting sizes. Topic aliases, hint authoring, and tuning must not use held-out judgments.

Include exact names, paraphrases, multi-term queries, abbreviations, OCR corruption, equations, cross-page subparts, diagrams/tables, course/campus/year restrictions, multiple-topic queries, and no-answer/no-match cases. Have a reviewer label all relevant question IDs and all required supporting source spans; disagreements require resolution. A gold set built only from existing seeds measures seed retrieval, not corpus coverage.

| Measure | Definition / use |
|---|---|
| Corpus coverage | Approved question and subpart records divided by manually counted source questions/subparts, with a separate asset/page-completeness audit. |
| Recall@K | Fraction of gold relevant question IDs found in first K results; report by query category, not only the mean. |
| Candidate recall | Recall before reranking; separates missing candidates from poor ordering. |
| nDCG@10 / MRR | Rank quality using reviewed relevance grades / first relevant result; cannot establish exhaustive completeness. |
| Complete evidence rate | Fraction of queries for which every required gold question/subpart/table/page span is present. |
| Filter leakage | Results outside requested course/campus/assessment/year/publication constraints; required zero on checked cases. |
| Exact listing completeness | Expected filtered IDs equal all returned IDs after pagination; required equality on checked fixtures. |
| Source accuracy | Returned question/page/section/citation actually corresponds to the reviewed source; audit links and page ranges. |
| Abstention quality | No-match requests don't receive invented questions or source-backed claims with unrelated evidence. |
| Latency and cost | Browser/server P50/P95 plus any embedding/rerank/generation cost; compare under the same corpus and query set. |

Suggested launch gates: zero checked filter leakage, exact-set equality for enumerations, all source links resolving correctly, no regression in exact identifier queries, and an improvement on held-out paraphrase/multi-term recall over the substring baseline. Set numerical recall/latency targets after observing that baseline; choosing “95% recall” before annotating the task does not validate it.

For hints, expert-review every authored pilot ladder for usefulness, factual support, level progression, and answer leakage. Include MCQ cases where naming the concept itself reveals the correct option, and prompts with missing graph/table data. Generated hints require an adversarial sample in addition to happy paths. “Zero observed leaks” means zero in that sample, not a formal guarantee.

Measure student learning with unassisted transfer questions and delayed checks, using a rubric for reasoning, misconception correction, and justification. Compare hint-enabled practice to the current explanation workflow with equivalent question difficulty and time. Hint clicks, satisfaction, time on page, and assisted correctness are engagement/productivity signals; none independently demonstrates critical thinking. The Bastani result makes that distinction central.

## Phased implementation

1. **Baseline and immediate retrieval repair:** share client/API question matching; use existing reviewed aliases; preserve technical terms; retain exact filters and all-match counts. Capture baseline versus improved cases with a small executable check and browser evidence. Keep this labeled a seed-corpus improvement.
2. **Corpus completeness:** audit every registered pilot paper, correct extraction issues, publish complete question/subpart/source assets after review, and track remaining unreadable content. Require a question-count reconciliation before claiming paper coverage.
3. **Reviewed hints in the existing cards:** author a small pilot across political concepts and algorithms, retain separate answer reveal, collect learner attempts only as needed, and verify keyboard/mobile behavior. Expand after hint quality review.
4. **Measured hybrid retrieval:** use the existing Supabase/pgvector direction when server-backed persistence is implemented; compare lexical, dense, and RRF on held-out queries. Add a reranker only when candidate-versus-ranking analysis justifies it.
5. **Grounded adaptive tutoring:** add server-side generated hints with source validation, abstention, bounded escalation, leakage checks, and learning evaluation. The static demo should clearly expose only capabilities it actually supports.

The first release can therefore improve retrieval and add authored nudges without a new vector service, a graph database, an agent orchestration layer, or an unvalidated claim of learning improvement. Full-paper coverage and validated semantic retrieval remain separate acceptance milestones.

## Local pilot implementation and acceptance limits

The local pilot implements `lib/question-search.ts` as a shared pure lexical/topic-assisted ranker for `QuestionSearch` and `/api/questions`. It normalizes punctuation and possessives, searches question text and options, uses existing topic aliases, keeps all matching records, and retains explicit topic/assessment filters. The pilot trusts the curated seed bank: `Question` has no publication/review field, and all CS F364 source materials are still marked `review`. A material-level publication gate would hide all 22 CS F364 questions; proper question approval needs its own explicit data state before production. Alias expansion deliberately returns related topic questions as well as direct text matches; its precision is not yet benchmarked on a held-out relevance set. It does not implement vectors, RRF, reranking, question extraction, new corpus coverage, or changes to the separate chat passage retriever.

`StudyNudges` adds three progressive prompts inside question cards and the practice panel. Four question IDs (`q-5`, `q-6`, `d-4`, `d-9`) have tailored authored sequences; the other questions receive explicitly labeled reflection prompts. After the first prompt, another prompt requires the learner to update their local attempt or describe the remaining confusion. The panel does not grade that attempt or call a model, and never reads `Question.answer`. The authored sequences still need instructor review; no learning benefit or leak-proof tutoring claim has been established. Existing chat, answer reveal, and source PDFs can still provide solutions.

Run the bounded smoke check against a running local app with `npm run check:retrieval -- http://127.0.0.1:3000`. It checks six expected leading results (including reordered terms, possessives, abbreviations and an answer-option name), live client/API parity, exact filtered enumeration, no-match behavior, input immutability, and nudge structure. Comparing whole answer-key strings is only a mechanical guard against copying, not a semantic answer-leakage test. This is a regression check, not the held-out benchmark proposed above.

Local acceptance evidence: TypeScript validation, `npm run build`, and the six-case smoke check against the production server passed. Agent-browser verified LCS search, the first/next-nudge interaction and attempt-update gate, practice-panel availability, and expansion at a 390-pixel mobile viewport with no horizontal document overflow. These checks establish bounded UI/API behavior; they do not establish full-corpus recall, instructor approval, semantic leakage resistance, or learning improvement. Changes are local and have not been pushed or deployed.
