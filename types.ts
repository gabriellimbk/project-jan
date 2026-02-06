
export interface Question {
  id: string;
  number: string;
  text: string;
  points: number;
  guidance: string;
  reinforcement: string;
  clarification: string;
}

export interface Feedback {
  score: number;
  status: 'reinforcement' | 'clarification';
  aiNotes: string;
  socraticQuestion: string;
}

export interface Submission {
  questionId: string;
  answer: string;
  feedback?: Feedback;
  isSubmitting: boolean;
}

export interface StudentSession {
  id: string;
  studentName: string;
  timestamp: number;
  submissions: Record<string, Submission>;
  totalScore: number;
  maxScore: number;
}

export enum AppState {
  WELCOME = 'WELCOME',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  TEACHER = 'TEACHER'
}
