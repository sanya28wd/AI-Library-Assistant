import { basePath } from "@/lib/site";
import { AssessmentType, Course, Material, PaperSection, Question, Topic } from "@/lib/types";

export const courses: Course[] = [
  { id: "gs-f211", code: "GS F211", name: "Modern Political Concepts", campus: "Dubai", semester: "I 2025-26", available: true },
  { id: "cs-f364", code: "CS F364", name: "Design and Analysis of Algorithms", campus: "Dubai", semester: "II 2025-26", available: true }
];

export const topics: Topic[] = [
  { id: "liberalism", courseId: "gs-f211", name: "Liberalism", description: "Classical, new and neo-classical liberalism; liberty and the welfare state.", keywords: ["liberalism", "laissez faire", "hayek", "rawls", "nozick", "welfare"] },
  { id: "marxism", courseId: "gs-f211", name: "Marxism & Socialism", description: "Class, exploitation, surplus value, ownership and socialism.", keywords: ["marx", "marxism", "socialism", "surplus value", "proletariat", "bourgeoisie", "class struggle", "working class"] },
  { id: "feminism", courseId: "gs-f211", name: "Feminism", description: "Patriarchy, misogyny and major feminist traditions.", keywords: ["feminism", "patriarchy", "misogyny", "gender", "women"] },
  { id: "fascism", courseId: "gs-f211", name: "Fascism", description: "Fascist ideology, propaganda and authoritarian politics.", keywords: ["fascism", "fascist", "nazi", "propaganda", "hitler", "mass media"] },
  { id: "capitalism", courseId: "gs-f211", name: "Capitalism & Political Economy", description: "Markets, property, capitalism and political control of economic life.", keywords: ["capitalism", "market", "capital", "property", "adam smith", "keynes"] },
  { id: "china", courseId: "gs-f211", name: "Chinese Revolution", description: "Maoism, the Chinese revolution and China’s open-door policy.", keywords: ["china", "mao", "maois", "open door"] },

  { id: "asymptotic", courseId: "cs-f364", name: "Asymptotic Analysis & Recurrences", description: "Big-O, Θ and Ω notation, recurrences, the master theorem and amortised analysis.", keywords: ["asymptotic", "big-o", "big o", "theta", "omega", "recurrence", "master theorem", "substitution method", "amortized", "amortised", "time complexity"] },
  { id: "divide-conquer", courseId: "cs-f364", name: "Divide & Conquer and Sorting", description: "Quicksort, merge sort, binary search, selection and other divide-and-conquer algorithms.", keywords: ["divide and conquer", "divide-and-conquer", "quicksort", "quick sort", "merge sort", "insertion sort", "binary search", "sorting", "strassen", "karatsuba"] },
  { id: "greedy", courseId: "cs-f364", name: "Greedy Algorithms", description: "Huffman coding, job sequencing, fractional knapsack and greedy choice.", keywords: ["greedy", "huffman", "job sequencing", "fractional knapsack", "activity selection"] },
  { id: "graphs", courseId: "cs-f364", name: "Graphs, MST & Shortest Paths", description: "Prim, Kruskal, Dijkstra, Bellman-Ford and all-pairs shortest paths.", keywords: ["spanning tree", "prim's", "prims", "kruskal", "dijkstra", "bellman", "floyd", "shortest path", "all pair", "graph traversal"] },
  { id: "network-flow", courseId: "cs-f364", name: "Network Flow", description: "Maximum flow, residual graphs, cuts and Ford-Fulkerson.", keywords: ["max flow", "maximum flow", "network flow", "residual", "ford", "fulkerson", "min cut", "bottleneck"] },
  { id: "dynamic-programming", courseId: "cs-f364", name: "Dynamic Programming", description: "0/1 knapsack, LCS, optimal BSTs, matrix chains and DP on trees.", keywords: ["dynamic programming", "0/1 knapsack", "knapsack", "longest common subsequence", "optimal binary search tree", "matrix chain", "assembly line", "multistage"] },
  { id: "backtracking", courseId: "cs-f364", name: "Backtracking & Branch and Bound", description: "N-Queens, sum of subsets, graph colouring and branch-and-bound search.", keywords: ["backtracking", "branch and bound", "n-queens", "queens", "sum of subsets", "subset sum", "graph coloring", "graph colouring", "hamiltonian"] },
  { id: "np", courseId: "cs-f364", name: "NP-Completeness & Approximation", description: "P vs NP, reductions, SAT, clique, vertex cover, bin packing and approximation algorithms.", keywords: ["np-complete", "np complete", "np-hard", "np hard", "p and np", "reduction", "satisfiability", "3sat", "cnf", "clique", "vertex cover", "node cover", "approximation", "bin packing", "non-deterministic", "nondeterministic"] },
  { id: "lp-assignment", courseId: "cs-f364", name: "Linear Programming & Assignment", description: "Linear programming, the simplex method and the Hungarian assignment method.", keywords: ["linear programming", "simplex", "hungarian", "assignment problem"] }
];

const modpol = { courseId: "gs-f211", campus: "Dubai" };
const daaDubai = { courseId: "cs-f364", campus: "Dubai", kind: "paper" as const, title: "CS F364 Question Paper", status: "review" as const };
const daaHyderabad = { ...daaDubai, campus: "Hyderabad" };
const daaFolder = "papers/papers-design and analysis of alogorithm";

function section(label: string, assessmentType: AssessmentType, startPage: number, note?: PaperSection["note"]): PaperSection {
  return { label, assessmentType, startPage, note };
}

// Years, sessions and sections follow each paper's own exam headers (see data/ingested-materials.json).
export const materials: Material[] = [
  { ...modpol, id: "paper-930", title: "GS F211 Question Paper", fileName: "930.pdf", source: "papers/modpol/930.pdf", kind: "paper", year: "2019-20", session: "First Semester", assessmentType: "Comprehensive", pages: 4, status: "review", sections: [section("Comprehensive", "Comprehensive", 1), section("Test 1", "Test", 3)] },
  { ...modpol, id: "paper-1136", title: "GS F211 Question Paper", fileName: "1136.pdf", source: "papers/modpol/1136.pdf", kind: "paper", year: "2019-20", session: "First Semester", assessmentType: "Comprehensive", pages: 9, status: "review" },
  { ...modpol, id: "paper-1645", title: "GS F211 Question Paper", fileName: "1645.pdf", source: "papers/modpol/1645.pdf", kind: "paper", year: "2022-23", session: "Second Semester", assessmentType: "Quiz", pages: 16, status: "review", sections: [section("Quiz 1", "Quiz", 1), section("Comprehensive", "Comprehensive", 6)] },
  { ...modpol, id: "compre-mcq", title: "Comprehensive Quiz MCQ", fileName: "Compre Quiz_MCQ.docx.pdf", source: "papers/modpol/Compre Quiz_MCQ.docx.pdf", kind: "paper", year: "2025-26", session: "Second Semester", assessmentType: "Comprehensive", pages: 2, status: "published", answerKeyId: "compre-key" },
  { ...modpol, id: "paper-1499", title: "GS F211 Question Paper", fileName: "1499.pdf", source: "papers/modpol/1499.pdf", kind: "paper", year: "2021-22", session: "Second Semester", assessmentType: "Quiz", pages: 12, status: "review", sections: [section("Quiz", "Quiz", 1), section("Comprehensive Quiz", "Comprehensive", 4, "answer key")] },
  { ...modpol, id: "paper-1947", title: "GS F211 Question Paper", fileName: "1947.pdf", source: "papers/modpol/1947.pdf", kind: "paper", year: "2024-25", session: "Second Semester", assessmentType: "Quiz", pages: 8, status: "review", sections: [section("Quiz", "Quiz", 1), section("Comprehensive Essay", "Comprehensive", 4)] },
  { ...modpol, id: "compre-key", title: "Comprehensive Answer Key", fileName: "Compre answer key_combined.docx.pdf", source: "papers/modpol/Compre answer key_combined.docx.pdf", kind: "answer-key", year: "2025-26", session: "Second Semester", assessmentType: "Comprehensive", pages: 10, status: "published" },
  { ...modpol, id: "paper-1570", title: "GS F211 Question Paper", fileName: "1570.pdf", source: "papers/modpol/1570.pdf", kind: "paper", year: "2022-23", session: "First Semester", assessmentType: "Mid-semester", pages: 11, status: "review", sections: [section("Mid-semester (24 Oct)", "Mid-semester", 1, "answer key"), section("Mid-semester (1 Nov)", "Mid-semester", 3, "answer key")] },
  { ...modpol, id: "mid-term-parts", title: "Mid-Term Parts II and III", fileName: "MPC-Mid-Term Part II and III.docx", source: "papers/modpol/MPC-Mid-Term Part II and III.docx", kind: "paper", year: "2024-25", session: "First Semester", assessmentType: "Mid-semester", pages: 3, status: "published" },
  { ...modpol, id: "quiz-key", title: "Comprehensive Quiz Answer Key", fileName: "Compre Quiz_answer key.docx", source: "papers/modpol/Compre Quiz_answer key.docx", kind: "answer-key", year: "2025", assessmentType: "Comprehensive", pages: 5, status: "published" },
  { ...modpol, id: "parts-key", title: "Comprehensive Parts II and III Answer Key", fileName: "Compre Part II  and Part 3_Answer key.docx", source: "papers/modpol/Compre Part II  and Part 3_Answer key.docx", kind: "answer-key", year: "2025", assessmentType: "Comprehensive", pages: 6, status: "published" },
  { ...modpol, id: "mid-quiz", title: "Mid-Term Quiz", fileName: "MPC Mid-term Quiz.docx", source: "papers/modpol/MPC Mid-term Quiz.docx", kind: "paper", year: "2024-25", session: "First Semester", assessmentType: "Quiz", pages: 2, status: "published" },
  { ...modpol, id: "handout", title: "GS F211 Course Handout", fileName: "GS F211 Modern Political Concepts I-Sem 2025-26 HO.docx.pdf", source: "course handout /GS F211 Modern Political Concepts I-Sem 2025-26 HO.docx.pdf", kind: "handout", year: "2025", assessmentType: null, pages: 4, status: "published" },
  { ...modpol, id: "notice-a", title: "Sample Compre Notice", fileName: "Untitled document (5).pdf", source: "exam notices /Untitled document (5).pdf", kind: "notice", year: "2025", assessmentType: "Comprehensive", pages: 1, status: "fixture" },
  { ...modpol, id: "notice-b", title: "Sample Mid-sem Notice", fileName: "Untitled document (5) copy.pdf", source: "exam notices /Untitled document (5) copy.pdf", kind: "notice", year: "2025", assessmentType: "Mid-semester", pages: 1, status: "fixture" },

  { ...daaDubai, id: "daa-124", fileName: "cs-f364/dubai/124.pdf", source: `${daaFolder}/dubai campus /124.pdf`, year: "2014-15", session: "Second Semester", assessmentType: "Comprehensive", pages: 11, sections: [section("Comprehensive", "Comprehensive", 1), section("Test 2", "Test", 4), section("Test 1", "Test", 6), section("Quiz 2", "Quiz", 8), section("Quiz 1", "Quiz", 10)] },
  { ...daaDubai, id: "daa-416", fileName: "cs-f364/dubai/416.pdf", source: `${daaFolder}/dubai campus /416.pdf`, year: "2016-17", session: "Second Semester", assessmentType: "Test", pages: 5, sections: [section("Test 2", "Test", 1), section("Test 1", "Test", 3), section("Comprehensive", "Comprehensive", 4)] },
  { ...daaDubai, id: "daa-598", fileName: "cs-f364/dubai/598.pdf", source: `${daaFolder}/dubai campus /598.pdf`, year: "2017-18", session: "Second Semester", assessmentType: "Test", pages: 11, sections: [section("Test 2", "Test", 1, "solutions"), section("Test 1", "Test", 4, "solutions"), section("Comprehensive", "Comprehensive", 8, "solutions")] },
  { ...daaDubai, id: "daa-821", fileName: "cs-f364/dubai/821.pdf", source: `${daaFolder}/dubai campus /821.pdf`, year: "2018-19", session: "Second Semester", assessmentType: "Test", pages: 10, sections: [section("Test 1", "Test", 1), section("Quiz 1", "Quiz", 3), section("Test 2", "Test", 5), section("Comprehensive", "Comprehensive", 7)] },
  { ...daaDubai, id: "daa-1026", fileName: "cs-f364/dubai/1026.pdf", source: `${daaFolder}/dubai campus /1026.pdf`, year: "2019-20", session: "Second Semester", assessmentType: "Comprehensive", pages: 18, sections: [section("Comprehensive", "Comprehensive", 1), section("Test 2", "Test", 6, "answer key"), section("Test 1", "Test", 15), section("Quiz", "Quiz", 17, "answer key")] },
  { ...daaDubai, id: "daa-1277", fileName: "cs-f364/dubai/1277.pdf", source: `${daaFolder}/dubai campus /1277.pdf`, year: "2020-21", session: "Second Semester", assessmentType: "Test", pages: 18, sections: [section("Test 1", "Test", 1), section("Test 2", "Test", 3), section("Comprehensive (Set A)", "Comprehensive", 7), section("Comprehensive (Set B)", "Comprehensive", 13)] },
  { ...daaDubai, id: "daa-1915", fileName: "cs-f364/dubai/1915.pdf", source: `${daaFolder}/dubai campus /1915.pdf`, year: "2024-25", session: "Second Semester", assessmentType: "Mid-semester", pages: 18, sections: [section("Mid-semester", "Mid-semester", 1), section("Comprehensive", "Comprehensive", 13)] },
  { ...daaHyderabad, id: "daa-hyd-midsem", fileName: "cs-f364/hyderabad/Midsem.pdf", source: `${daaFolder}/hyderabad campus/Midsem.pdf`, year: "2023-24", session: "Second Semester", assessmentType: "Mid-semester", pages: 1 },
  { ...daaHyderabad, id: "daa-hyd-compre-a", fileName: "cs-f364/hyderabad/Part-A-QP.pdf", source: `${daaFolder}/hyderabad campus/Part-A-QP.pdf`, year: "2023-24", session: "Second Semester", assessmentType: "Comprehensive", pages: 3, sections: [section("Comprehensive Part A", "Comprehensive", 1)] },
  { ...daaHyderabad, id: "daa-hyd-compre-b", fileName: "cs-f364/hyderabad/Part-B-QP.pdf", source: `${daaFolder}/hyderabad campus/Part-B-QP.pdf`, year: "2023-24", session: "Second Semester", assessmentType: "Comprehensive", pages: 2, sections: [section("Comprehensive Part B", "Comprehensive", 1)] }
];

export const questions: Question[] = [
  { id: "q-1", text: "With the emergence of New Liberalism, which government adopted neo-classical Liberalism?", options: ["Japanese government under Shinzo Abe", "Indian government under Manmohan Singh", "Reagan government in the US", "Sunak Government in UK"], marks: 1, topicIds: ["liberalism"], materialId: "mid-quiz", page: 1, answer: "Reagan government in the US", verifiedAnswer: true },
  { id: "q-2", text: "Match Thomas Hobbes, Robert Nozick, Thomas Paine and John Rawls with Leviathan, Anarchy, State and Utopia, Common Sense, and A Theory of Justice.", marks: 1, topicIds: ["liberalism"], materialId: "mid-quiz", page: 1, answer: "Hobbes - Leviathan; Nozick - Anarchy, State and Utopia; Paine - Common Sense; Rawls - A Theory of Justice.", verifiedAnswer: true },
  { id: "q-3", text: "Which philosopher suggested collective control of resources to overcome greed and fear?", options: ["G. A. Cohen", "Thomas Paine", "John Rawls", "Thomas Hobbes"], marks: 1, topicIds: ["marxism", "liberalism"], materialId: "mid-quiz", page: 1, answer: "G. A. Cohen", verifiedAnswer: true },
  { id: "q-4", text: "Under capitalism, private property rights resolve human relations into a what?", options: ["Cash nexus", "Wage slavery", "Proletarians", "Bourgeoisie"], marks: 1, topicIds: ["marxism", "capitalism"], materialId: "mid-quiz", page: 1, answer: "Cash nexus", verifiedAnswer: true },
  { id: "q-5", text: "What is surplus value? Explain it to someone who has not studied political concepts and explain why it matters in their life.", marks: 4, topicIds: ["marxism", "capitalism"], materialId: "compre-mcq", page: 1, answer: "Surplus value is the unpaid value created by a worker beyond their wage; Marx used it to explain exploitation and capitalist accumulation.", verifiedAnswer: true },
  { id: "q-6", text: "Which form of feminism believes equality requires changing the capitalist mode of production?", options: ["Radical Feminism", "Socialist feminism", "Liberal Feminism"], marks: 1, topicIds: ["feminism", "marxism"], materialId: "compre-mcq", page: 1, answer: "Socialist feminism", verifiedAnswer: true },
  { id: "q-7", text: "What tools does fascism use to manipulate public opinion?", marks: 1, topicIds: ["fascism"], materialId: "compre-mcq", page: 1, answer: "Controlled mass media, scapegoating, restrictions on unions, and suppression of intellectual opposition.", verifiedAnswer: true },
  { id: "q-8", text: "What is UBI? Trace its historical origin and explain why philosophers and activists advocate it today.", marks: 5, topicIds: ["liberalism", "capitalism"], materialId: "mid-term-parts", page: 1, verifiedAnswer: false },
  { id: "q-9", text: "Explain China’s open-door policy. What were the external and internal causes of the Maoist revolution in China?", marks: 5, topicIds: ["china", "marxism"], materialId: "mid-term-parts", page: 1, verifiedAnswer: false },
  { id: "q-10", text: "Explain the political argument of a text on fiscal conservatism and austerity, and identify the author’s political inclination.", marks: 5, topicIds: ["liberalism", "capitalism"], materialId: "mid-term-parts", page: 2, verifiedAnswer: false },

  // CS F364: question text is condensed from the paper; open the source page for tables, graphs and figures.
  { id: "d-1", text: "Given seven characters with their frequencies, build the Huffman code tree, find the codeword for each character, compute the total bits transmitted and the percentage saving over 8-bit ASCII, and state the running time.", marks: 4, topicIds: ["greedy"], materialId: "daa-124", page: 1, verifiedAnswer: false },
  { id: "d-2", text: "A taxi company has one taxi at each of five depots and a customer waiting in each of five towns. Using the given distance matrix, assign taxis to customers to minimise the total distance travelled. What is the Hungarian method?", marks: 3, topicIds: ["lp-assignment"], materialId: "daa-124", page: 1, verifiedAnswer: false },
  { id: "d-3", text: "Apply bottom-up dynamic programming to the given 0/1 knapsack instance with capacity W = 10 and identify the items in the optimal subset. Which other algorithms can solve knapsack problems?", marks: 3, topicIds: ["dynamic-programming"], materialId: "daa-124", page: 2, verifiedAnswer: false },
  { id: "d-4", text: "Find the longest common subsequence of ABCBDAB and BDCAB, and write an algorithm to compute the length of the LCS.", marks: 3, topicIds: ["dynamic-programming"], materialId: "daa-124", page: 2, verifiedAnswer: false },
  { id: "d-5", text: "Solve the given 15-puzzle instance using a branch and bound algorithm and write its pseudocode.", marks: 2, topicIds: ["backtracking"], materialId: "daa-124", page: 2, verifiedAnswer: false },
  { id: "d-6", text: "Which pivot choice gives Quicksort its lowest running time, and which gives the highest? Justify both through best-case, worst-case and average-case complexity analysis.", marks: 7, topicIds: ["divide-conquer", "asymptotic"], materialId: "daa-821", page: 1, verifiedAnswer: false },
  { id: "d-7", text: "Can binary search improve insertion sort? Write pseudocode for BinaryInsertionSort and justify whether it improves the asymptotic best, worst and average case time complexity.", marks: 7, topicIds: ["divide-conquer", "asymptotic"], materialId: "daa-821", page: 1, verifiedAnswer: false },
  { id: "d-8", text: "Write pseudocode to compute the kth-maximum element of an array of distinct elements. Give its best, worst and average case time complexity. Does it depend on k? Write the most efficient algorithm.", marks: 6, topicIds: ["divide-conquer", "asymptotic"], materialId: "daa-821", page: 1, verifiedAnswer: false },
  { id: "d-9", text: "For the given graph, find the minimum spanning tree using Prim’s algorithm. Give the adjacency matrix, show the arrays ‘t’ and ‘near’ at each step, and state the cost of the MST.", marks: 10, topicIds: ["graphs", "greedy"], materialId: "daa-416", page: 1, verifiedAnswer: false, visuals: [{ page: 1, fileName: "previews/daa-416/page-1.png", caption: "Question 1 · upper diagram · undirected weighted graph", description: "Question 1 uses an undirected weighted graph with vertices 1, 2, 3, 4, 5 and 6. Edges and weights: 1–2 (14), 1–3 (9), 1–4 (13), 2–6 (7), 3–5 (6), 4–5 (2), 5–6 (11). The task asks for Prim’s minimum spanning tree, the adjacency matrix, arrays t and near at each step, and the tree cost. These are input weights, not a solution." }] },
  { id: "d-10", text: "Compute the all-pairs shortest path cost matrix for the given graph, clearly showing each intermediate matrix A⁰ to A⁵.", marks: 10, topicIds: ["graphs", "dynamic-programming"], materialId: "daa-416", page: 1, verifiedAnswer: false, visuals: [{ page: 1, fileName: "previews/daa-416/page-1.png", caption: "Question 2 · lower diagram · directed weighted graph", description: "Question 2 uses a directed weighted graph with vertices 1, 2, 3, 4 and 5. Arcs and costs: 1→2 (6), 2→1 (1), 1→3 (8), 1→5 (3), 2→3 (7), 2→4 (9), 4→2 (4), 3→4 (5), 4→5 (7), 5→1 (2). Arrowheads determine direction; opposite arcs can have different costs. The task asks for all-pairs shortest-path cost matrices A⁰ through A⁵. These are input costs, not shortest-path results." }] },
  { id: "d-11", text: "Describe the CNF-Satisfiability and Clique decision problems. Prove that CNF-Satisfiability reduces to Clique and vice versa, with an example of forming a graph from a CNF formula.", marks: 10, topicIds: ["np"], materialId: "daa-416", page: 5, verifiedAnswer: false },
  { id: "d-12", text: "Bins have capacity L = 15 and seven items have sizes (10, 1, 5, 7, 6, 8, 2). Pack them using first fit, best fit, first fit decreasing, best fit decreasing and best fit increasing.", marks: 10, topicIds: ["np"], materialId: "daa-416", page: 5, verifiedAnswer: false },
  { id: "d-13", text: "Let w = {5, 7, 10, 15, 18, 20} and m = 35. Find all subsets of w that sum to m. How many subsets do you obtain?", options: ["1", "2", "3", "4"], marks: null, topicIds: ["backtracking"], materialId: "daa-1026", page: 18, verifiedAnswer: false },
  { id: "d-14", text: "In the N-Queens problem, with queens at (a, b) and (c, d), which condition checks for a diagonal clash? A: a − b = c − d. B: a + b = c + d.", options: ["Only A", "Only B", "Both A and B"], marks: null, topicIds: ["backtracking"], materialId: "daa-1026", page: 18, verifiedAnswer: false },
  { id: "d-15", text: "For the given flow network with source a and sink g: compute the capacity of the cut A = {a, b, c, d}, B = {e, f, g}; then find the bottleneck of path a-c-d-e-f-g and draw the residual graph after pushing that flow.", marks: 7, topicIds: ["network-flow", "graphs"], materialId: "daa-1277", page: 4, verifiedAnswer: false, visuals: [{ page: 4, fileName: "previews/daa-1277/page-4.png", caption: "Question 4 · directed flow network · both subparts", description: "Question 4 uses a directed flow network with source a and sink g; vertices are a, b, c, d, e, f and g. Arcs and capacities: a→c (20), a→b (10), c→d (20), c→e (33), b→d (50), b→e (10), b→f (72), d→e (17), d→f (40), e→f (14), e→g (7), f→g (88). Subpart a gives cut A={a,b,c,d}, B={e,f,g}. Subpart b gives path a-c-d-e-f-g and asks for its bottleneck and the residual graph after pushing that flow. Capacities are input data, not computed flow values." }] },
  { id: "d-16", text: "Write a non-deterministic algorithm that sorts each row of an M × N integer matrix in ascending order.", marks: null, topicIds: ["np"], materialId: "daa-1277", page: 4, verifiedAnswer: false },
  { id: "d-17", text: "Seven jobs have profits (250, 230, 240, 350, 170, 150, 100) and deadlines (6, 4, 4, 3, 5, 3, 2). With unit-time jobs and a 6-unit timeline, which jobs maximise profit, in what order should they run, and what is the total profit?", marks: 4, topicIds: ["greedy"], materialId: "daa-1915", page: 8, verifiedAnswer: false },
  { id: "d-18", text: "True or false, with justification: solving T(n) = √n·T(√n) + n by the substitution method gives T(n) = O(n lg lg n).", marks: 1, topicIds: ["asymptotic"], materialId: "daa-1915", page: 13, verifiedAnswer: false },
  { id: "d-19", text: "Solve the recurrence T(n) = 2T(n/2) + n log n (the master theorem does not apply), and solve aₙ − 3aₙ₋₁ + 2aₙ₋₂ = 0 with a₀ = 1, a₁ = 3 using generating functions.", marks: 20, topicIds: ["asymptotic"], materialId: "daa-hyd-midsem", page: 1, verifiedAnswer: false },
  { id: "d-20", text: "MaxDiff: find the maximum difference between any two of n elements. Count the comparisons of the min/max approach, then design a divide-and-conquer algorithm using about 3n/2 comparisons, with pseudocode and its recurrence.", marks: 15, topicIds: ["divide-conquer", "asymptotic"], materialId: "daa-hyd-midsem", page: 1, verifiedAnswer: false },
  { id: "d-21", text: "Given integers A₁…Aₙ, find i ≤ j maximising Aᵢ + … + Aⱼ with a divide-and-conquer algorithm in O(n log n). Write its recurrence and solution.", marks: 10, topicIds: ["divide-conquer", "asymptotic"], materialId: "daa-hyd-compre-b", page: 1, verifiedAnswer: false },
  { id: "d-22", text: "Find the largest independent set in a rooted tree: give the recursive relation, describe the linear-time dynamic programming solution, and analyse its running time.", marks: 10, topicIds: ["dynamic-programming", "graphs"], materialId: "daa-hyd-compre-b", page: 1, verifiedAnswer: false }
];

export function topicForId(id: string): Topic | undefined { return topics.find((topic) => topic.id === id); }
export function materialForId(id: string): Material | undefined { return materials.find((material) => material.id === id); }
export function courseForId(id: string): Course | undefined { return courses.find((course) => course.id === id); }

export const assessmentTypes: AssessmentType[] = ["Quiz", "Test", "Mid-semester", "Comprehensive"];

export function topicsForCourse(courseId: string): Topic[] { return topics.filter((topic) => topic.courseId === courseId); }
export function questionsForCourse(courseId: string): Question[] { return questions.filter((question) => materialForId(question.materialId)?.courseId === courseId); }

export function sourcePath(fileName: string): string {
  return `${basePath}/materials/${fileName.split("/").map(encodeURIComponent).join("/")}`;
}

/** The exam a page belongs to, for files that bundle several exams. */
export function sectionAt(material: Material, page: number): PaperSection | undefined {
  return material.sections?.filter((item) => item.startPage <= page).at(-1);
}

export function assessmentOf(question: Question): AssessmentType | null {
  const material = materialForId(question.materialId);
  if (!material) return null;
  return sectionAt(material, question.page)?.assessmentType ?? material.assessmentType;
}

/** "Test 2 - 2016-17 Second Semester", naming the exam on that page when the file bundles several. */
export function examLabel(material: Material, page?: number): string {
  const exam = (page ? sectionAt(material, page) : undefined) ?? (material.sections?.length === 1 ? material.sections[0] : undefined);
  return `${exam?.label ?? material.assessmentType ?? "Paper"} - ${material.year}${material.session ? ` ${material.session}` : ""}`;
}

export function paperTitle(material: Material): string {
  if ((material.sections?.length ?? 0) > 1) return `${material.year} ${material.session ?? ""} - ${material.sections!.length} exams`.replace("  ", " ");
  return examLabel(material);
}

// Newest academic year first; "2024-25" and "2024" sort on their first year.
export function papersForCourse(courseId: string): Material[] {
  return materials
    .filter((material) => material.kind === "paper" && material.courseId === courseId)
    .sort((a, b) => b.year.localeCompare(a.year) || (b.session ?? "").localeCompare(a.session ?? ""));
}

export function assessmentTypesForCourse(courseId: string): AssessmentType[] {
  const used = new Set(questionsForCourse(courseId).map(assessmentOf));
  return assessmentTypes.filter((type) => used.has(type));
}

export const chatSuggestions: Record<string, string[]> = {
  "gs-f211": ["What is surplus value?", "How does fascism use propaganda?", "Summarise the main ideas of liberalism", "What has the compre asked about feminism?"],
  "cs-f364": ["How does Prim’s algorithm work?", "When is quicksort worst case?", "Explain the Hungarian method", "What NP-completeness questions come up in the compre?"]
};

export function searchHref(courseId: string, topicIds: string[] = [], assessment?: AssessmentType | null): string {
  const params = new URLSearchParams();
  topicIds.forEach((id) => params.append("topic", id));
  if (assessment) params.set("assessment", assessment);
  const query = params.toString();
  return `/courses/${courseId}/search${query ? `?${query}` : ""}`;
}
