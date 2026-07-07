import { Question, InterviewState } from './types';
import { getCategoryById, preambleQuestions } from './questions';

export function createInterview(categoryId: string): InterviewState {
  const category = getCategoryById(categoryId);
  if (!category) throw new Error(`Unknown category: ${categoryId}`);

  const allQuestions = [...preambleQuestions, ...category.questions];
  return {
    categoryId,
    currentQuestionIndex: 0,
    answers: {},
    questionOrder: allQuestions.map(q => q.id),
    history: [],
  };
}

export function getAllQuestions(categoryId: string): Question[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  return [...preambleQuestions, ...category.questions];
}

export function getCurrentQuestion(state: InterviewState): Question | null {
  const questions = getAllQuestions(state.categoryId);
  const questionId = state.questionOrder[state.currentQuestionIndex];
  if (!questionId) return null;
  return questions.find(q => q.id === questionId) || null;
}

function findNextQuestion(
  allQuestions: Question[],
  currentQuestion: Question,
  answer: string
): Question | undefined {
  if (currentQuestion.branches && currentQuestion.branches[answer]) {
    const targetId = currentQuestion.branches[answer];
    return allQuestions.find(q => q.id === targetId);
  }

  if (currentQuestion.next) {
    return allQuestions.find(q => q.id === currentQuestion.next);
  }

  const currentIdx = allQuestions.findIndex(q => q.id === currentQuestion.id);
  return allQuestions[currentIdx + 1];
}

function getSkippedIds(
  allQuestions: Question[],
  currentQuestion: Question,
  answer: string,
  nextQuestion: Question | undefined
): string[] {
  if (!currentQuestion.branches || !nextQuestion) return [];

  const currentIdx = allQuestions.findIndex(q => q.id === currentQuestion.id);
  const nextIdx = allQuestions.findIndex(q => q.id === nextQuestion.id);

  if (nextIdx <= currentIdx + 1) return [];

  return allQuestions
    .slice(currentIdx + 1, nextIdx)
    .map(q => q.id);
}

export function answerQuestion(
  state: InterviewState,
  answer: string
): InterviewState {
  const currentQuestion = getCurrentQuestion(state);
  if (!currentQuestion) return state;

  const allQuestions = getAllQuestions(state.categoryId);
  const nextQuestion = findNextQuestion(allQuestions, currentQuestion, answer);

  const newAnswers = { ...state.answers, [currentQuestion.id]: answer };

  const skippedIds = getSkippedIds(allQuestions, currentQuestion, answer, nextQuestion);
  for (const id of skippedIds) {
    delete newAnswers[id];
  }

  const nextIndex = nextQuestion
    ? state.questionOrder.indexOf(nextQuestion.id)
    : state.questionOrder.length;

  return {
    ...state,
    currentQuestionIndex: nextIndex,
    answers: newAnswers,
    history: [...(state.history || []), state.currentQuestionIndex],
  };
}

export function goBack(state: InterviewState): InterviewState {
  const history = state.history || [];
  if (history.length === 0) return state;

  const previousIndex = history[history.length - 1];
  return {
    ...state,
    currentQuestionIndex: previousIndex,
    history: history.slice(0, -1),
  };
}

export function isComplete(state: InterviewState): boolean {
  return state.currentQuestionIndex >= state.questionOrder.length;
}

export function getProgress(state: InterviewState): number {
  const history = state.history || [];
  const answered = history.length;
  const allQuestions = getAllQuestions(state.categoryId);
  const estimatedTotal = allQuestions.length;
  if (estimatedTotal === 0) return 0;
  return Math.min(answered / estimatedTotal, 1);
}

export function getSectionLabel(state: InterviewState): string | null {
  const question = getCurrentQuestion(state);
  return question?.section || null;
}
