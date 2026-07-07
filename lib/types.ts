export type AnswerType = 'freetext' | 'yesno' | 'choice' | 'multichoice';

export type Question = {
  id: string;
  text: string;
  answerType: AnswerType;
  choices?: string[];
  placeholder?: string;
  next?: string;
  branches?: Record<string, string>;
  summaryKey?: string;
  section: string;
  skippable?: boolean;
  // Real-time red flag: if the given answer is chosen (exact match for
  // yesno/choice, any-selected for multichoice), the interview pauses and
  // shows this message before continuing. "Tell staff now" — not medical advice.
  urgentAlert?: { on: string[]; message: string };
};

export type Category = {
  id: string;
  label: string;
  description: string;
  icon: string;
  estimateMinutes: number;
  questions: Question[];
};

export type InterviewState = {
  categoryId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  questionOrder: string[];
  history: number[];
};

export type SavedRecord = {
  id: string;
  timestamp: string;
  category: string;
  categoryLabel: string;
  patientName: string;
  companionName: string;
  relationship: string;
  summary: string;
  answers: Record<string, string>;
};
