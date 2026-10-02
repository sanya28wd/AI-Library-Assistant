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

The local pilot implements `lib/question-search.ts` as a shared pure lexical/topic-assisted ranker for `QuestionSearch` and `/api/questions`. It normalizes punctuation and possessives, searches question text, options and linked diagram transcriptions, uses existing topic aliases, keeps all matching records, and retains explicit topic/assessment filters. The pilot trusts the curated seed bank: `Question` has no publication/review field, and all CS F364 source materials are still marked `review`. A material-level publication gate would hide all 22 CS F364 questions; proper question approval needs its own explicit data state before production. Alias expansion deliberately returns related topic questions as well as direct text matches; its precision is not yet benchmarked on a held-out relevance set. It does not implement vectors, RRF, reranking, question extraction or new question-bank coverage. The passage retriever also indexes each annotated graph question as a complete unit with its source image and input transcription.

`StudyNudges` adds three progressive prompts inside question cards and the practice panel. Six question IDs (`q-5`, `q-6`, `d-4`, `d-9`, `d-10`, `d-15`) have tailored authored sequences; the other questions receive explicitly labeled reflection prompts. After the first prompt, another prompt requires the learner to update their local attempt or describe the remaining confusion. The panel does not grade that attempt or call a model, and never reads `Question.answer`. The authored sequences still need instructor review; no learning benefit or leak-proof tutoring claim has been established. Existing chat, answer reveal, and source PDFs can still provide solutions.

Run the bounded smoke check against a running local app with `npm run check:retrieval -- http://127.0.0.1:3000`. It checks six expected leading results (including reordered terms, possessives, abbreviations and an answer-option name), live client/API parity, exact filtered enumeration, no-match behavior, input immutability, and nudge structure. Comparing whole answer-key strings is only a mechanical guard against copying, not a semantic answer-leakage test. This is a regression check, not the held-out benchmark proposed above.

Local acceptance evidence: TypeScript validation, `npm run build`, and the six-case smoke check against the production server passed. Agent-browser verified LCS search, the first/next-nudge interaction and attempt-update gate, practice-panel availability, and expansion at a 390-pixel mobile viewport with no horizontal document overflow. These checks establish bounded UI/API behavior; they do not establish full-corpus recall, instructor approval, semantic leakage resistance, or learning improvement.

## Image retrieval: the DAA graph scenario

A diagram-bearing question should be retrieved as a package: its exact source page, original question number, statement/subparts, image, and graph inputs. OCR text alone may omit edge weights or discard an arrowhead. A page containing several questions does not establish which graph belongs to which question. Retrieving an unrelated graph with the right algorithm name is insufficient context.

The pilot now preserves three source-checked graph records:

| Question | Source | Required visual context |
|---|---|---|
| `d-9` | `cs-f364/dubai/416.pdf`, physical page 1, Question 1 | Upper undirected weighted graph, vertices 1–6, original input weights and Prim/adjacency/array instructions. |
| `d-10` | Same physical page, Question 2 | Lower directed graph, vertices 1–5, arrows and arc costs, including opposite arcs with different costs; requested intermediate matrices. |
| `d-15` | `cs-f364/dubai/1277.pdf`, physical page 4, Question 4 | Directed network, source/sink, capacities, the specified cut and path, and both subparts. The printed exam page number is 2. |

`Question.visuals` stores the original PNG page render, physical page, caption and a transcription checked against that render. Page images are rendered by the existing `scripts/render-pdf-pages.swift` at 200 DPI. These are original document images, not generated/redrawn graphs. The full page is retained to preserve surrounding instructions; captions distinguish diagrams sharing it, and students can open the image at full resolution. The inputs contain no computed MST, shortest-path matrix, cut total, bottleneck result or residual solution.

The question library searches captions and transcriptions as well as question text. The source-passage index adds each annotated graph question as a whole record instead of splitting its description into unrelated OCR chunks. Its returned source carries the matching image and provenance. The chat UI keeps that graph panel under the corresponding citation. Current model instructions receive the textual transcription, not the image pixels; the model is told to distinguish question numbers and not infer missing graph data from OCR fragments. Source-only retrieval is verified without an API key; live generated graph reasoning has not been verified.

The pilot supports text queries retrieving annotated images. It does not implement student screenshot uploads, automatic diagram extraction/transcription, or a learned image index. The three captions are source-checked pilot annotations, not an instructor-approved corpus or proof of universal image retrieval.

For broader visual discovery, benchmark [ColPali page-image retrieval](https://arxiv.org/abs/2407.01449), whose method embeds page images into multiple vectors and matches text queries by late interaction. Its [first-party Transformers documentation](https://huggingface.co/docs/transformers/model_doc/colpali) describes the implementation. This retrieves visually rich pages; it does not reconstruct reliable graph edges or identify complete question/subpart ownership automatically. I recommend combining its candidates with the existing text branch, then resolving the matched page to the correct question and expanding its original images and instructions. This hybrid design is a proposed local experiment, not a measured result for DAA.

If image-based interpretation is later added, attach the exact retrieved image to a vision-capable model together with the selected question and learner attempt. Require uncertainty when an arrow, label or weight is unreadable. Prefer source-checked graph inputs for numerical reasoning: a visually plausible transcription with one reversed edge can be academically wrong. Never mix weights from two graphs on the same page, redraw missing edges as facts, or treat a low-resolution screenshot as complete evidence.

Acceptance cases must include: diagram-only terminology absent from OCR; two graphs on one page; directed versus undirected graphs; reciprocal arcs with unequal weights; capacities versus chosen flow; physical versus printed page numbers; missing/rotated/cropped diagrams; contradictory/unreadable labels; and graph context under course/assessment filters. Require the original graph and every needed instruction/subpart to be available, not merely a semantically similar page. Keep image/query-to-question relevance metrics separate from correctness of graph transcription and student learning.

Run `npm run check:visual-context -- http://127.0.0.1:3000` against the server. It checks three caption-based leading results, directed/undirected word boundaries, question-specific image association, image bytes and HTTP delivery, source-page provenance, directional-cost sentinels, cross-course isolation and live question/chat API context. This is a bounded regression check; it does not establish held-out visual recall or numerical reasoning accuracy.

To regenerate the two pilot page images from their registered source PDFs on macOS, use the existing renderer:

```sh
swift scripts/render-pdf-pages.swift public/materials/cs-f364/dubai/416.pdf public/materials/previews/daa-416 1
swift scripts/render-pdf-pages.swift public/materials/cs-f364/dubai/1277.pdf public/materials/previews/daa-1277 4
```

A changed source PDF requires rechecking the transcription and physical-page mapping as well as regenerating the image.

Graph-pilot acceptance evidence: the production build and both runnable smoke commands pass. Agent-browser verified the diagram-only search result, native keyboard expansion, loading of the original 1655-pixel page image, graph context immediately under its matching chat source, and question/chat panels at a 390-pixel viewport without horizontal document overflow. Chat validation ran in `sources-only` mode because no API key was configured. No live model graph interpretation or student learning outcome is claimed.
