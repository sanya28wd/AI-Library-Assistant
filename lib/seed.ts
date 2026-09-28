import { Material, Question, Topic } from "@/lib/types";

export const subject = { id: "gs-f211", code: "GS F211", name: "Modern Political Concepts", semester: "I 2025-26" };

export const topics: Topic[] = [
  { id: "liberalism", name: "Liberalism", description: "Classical, new and neo-classical liberalism; liberty and the welfare state.", keywords: ["liberalism", "laissez faire", "hayek", "rawls", "nozick", "welfare"] },
  { id: "marxism", name: "Marxism & Socialism", description: "Class, exploitation, surplus value, ownership and socialism.", keywords: ["marx", "marxism", "socialism", "surplus value", "proletariat", "bourgeoisie", "class"] },
  { id: "feminism", name: "Feminism", description: "Patriarchy, misogyny and major feminist traditions.", keywords: ["feminism", "patriarchy", "misogyny", "gender", "women"] },
  { id: "fascism", name: "Fascism", description: "Fascist ideology, propaganda and authoritarian politics.", keywords: ["fascism", "fascist", "nazi", "propaganda", "hitler", "mass media"] },
  { id: "capitalism", name: "Capitalism & Political Economy", description: "Markets, property, capitalism and political control of economic life.", keywords: ["capitalism", "market", "capital", "property", "adam smith", "keynes"] },
  { id: "china", name: "Chinese Revolution", description: "Maoism, the Chinese revolution and China’s open-door policy.", keywords: ["china", "mao", "maois", "open door"] }
];

export const materials: Material[] = [
  { id: "paper-930", title: "GS F211 Question Paper", fileName: "930.pdf", kind: "paper", year: "2020", assessmentType: "Comprehensive", pages: 4, status: "review" },
  { id: "paper-1136", title: "GS F211 Question Paper", fileName: "1136.pdf", kind: "paper", year: "2023", assessmentType: "Comprehensive", pages: 9, status: "review" },
  { id: "paper-1645", title: "GS F211 Question Paper", fileName: "1645.pdf", kind: "paper", year: "2023", assessmentType: "Comprehensive", pages: 16, status: "review" },
  { id: "compre-mcq", title: "Comprehensive Quiz MCQ", fileName: "Compre Quiz_MCQ.docx.pdf", kind: "paper", year: "2025", assessmentType: "Comprehensive", pages: 2, status: "published" },
  { id: "paper-1499", title: "GS F211 Question Paper", fileName: "1499.pdf", kind: "paper", year: "2022", assessmentType: "Mid-semester", pages: 12, status: "review" },
  { id: "paper-1947", title: "GS F211 Question Paper", fileName: "1947.pdf", kind: "paper", year: "2024", assessmentType: "Mid-semester", pages: 8, status: "review" },
  { id: "compre-key", title: "Comprehensive Answer Key", fileName: "Compre answer key_combined.docx.pdf", kind: "answer-key", year: "2025", assessmentType: "Comprehensive", pages: 8, status: "published" },
  { id: "paper-1570", title: "GS F211 Question Paper", fileName: "1570.pdf", kind: "paper", year: "2023", assessmentType: "Comprehensive", pages: 11, status: "review" },
  { id: "mid-term-parts", title: "Mid-Term Parts II and III", fileName: "MPC-Mid-Term Part II and III.docx", kind: "paper", year: "2024", assessmentType: "Mid-semester", pages: 3, status: "published" },
  { id: "quiz-key", title: "Comprehensive Quiz Answer Key", fileName: "Compre Quiz_answer key.docx", kind: "answer-key", year: "2025", assessmentType: "Comprehensive", pages: 5, status: "published" },
  { id: "parts-key", title: "Comprehensive Parts II and III Answer Key", fileName: "Compre Part II  and Part 3_Answer key.docx", kind: "answer-key", year: "2025", assessmentType: "Comprehensive", pages: 6, status: "published" },
  { id: "mid-quiz", title: "Mid-Term Quiz", fileName: "MPC Mid-term Quiz.docx", kind: "paper", year: "2024", assessmentType: "Quiz", pages: 2, status: "published" },
  { id: "handout", title: "GS F211 Course Handout", fileName: "GS F211 Modern Political Concepts I-Sem 2025-26 HO.docx.pdf", kind: "handout", year: "2025", assessmentType: null, pages: 4, status: "published" },
  { id: "notice-a", title: "Sample Quiz Notice", fileName: "Untitled document (5).pdf", kind: "notice", year: "2025", assessmentType: "Quiz", pages: 1, status: "fixture" },
  { id: "notice-b", title: "Sample Quiz Notice Copy", fileName: "Untitled document (5) copy.pdf", kind: "notice", year: "2025", assessmentType: "Quiz", pages: 1, status: "fixture" }
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
  { id: "q-10", text: "Explain the political argument of a text on fiscal conservatism and austerity, and identify the author’s political inclination.", marks: 5, topicIds: ["liberalism", "capitalism"], materialId: "mid-term-parts", page: 2, verifiedAnswer: false }
];

export function topicForId(id: string): Topic | undefined { return topics.find((topic) => topic.id === id); }
export function materialForId(id: string): Material | undefined { return materials.find((material) => material.id === id); }
