
import React from 'react';
import { Question, Submission } from '../types';

interface QuestionCardProps {
  question: Question;
  submission: Submission;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  submission, 
  onChange, 
  onSubmit 
}) => {
  const isEvaluated = !!submission.feedback;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isEvaluated ? 'border-indigo-100' : 'border-slate-200'} overflow-hidden transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {question.number}
          </span>
          <span className="text-slate-400 text-sm font-medium">
            {question.points} Points
          </span>
        </div>
        
        <h2 className="text-xl font-semibold text-slate-800 mb-6 leading-relaxed">
          {question.text}
        </h2>

        {!isEvaluated ? (
          <div className="space-y-4">
            <textarea
              className="w-full min-h-[140px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
              placeholder="Type your answer here..."
              value={submission.answer}
              onChange={(e) => onChange(e.target.value)}
              disabled={submission.isSubmitting}
            />
            <button
              onClick={onSubmit}
              disabled={submission.isSubmitting || submission.answer.trim().length < 5}
              className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {submission.isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Evaluating...
                </>
              ) : 'Submit for Feedback'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-tighter mb-1">Your Submission:</p>
              <p className="text-slate-700 italic">"{submission.answer}"</p>
            </div>

            <div className={`p-5 rounded-xl border-l-4 ${
              submission.feedback?.status === 'reinforcement' 
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-emerald-50' 
              : 'bg-amber-50 border-amber-500 text-amber-900 shadow-amber-50'
            } shadow-md`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-lg font-bold flex items-center gap-2">
                  {submission.feedback?.status === 'reinforcement' ? (
                    <><span className="text-xl">✨</span> Great Work!</>
                  ) : (
                    <><span className="text-xl">💡</span> Keep Thinking...</>
                  )}
                </span>
                <span className="text-2xl font-black opacity-30">
                  {submission.feedback?.score}/{question.points}
                </span>
              </div>
              
              <p className="mb-4 text-sm leading-relaxed font-medium">
                {submission.feedback?.status === 'reinforcement' 
                  ? question.reinforcement 
                  : question.clarification}
              </p>

              <div className="space-y-3">
                <div className="bg-white/70 p-4 rounded-xl text-sm border border-black/5 shadow-sm">
                  <p className="font-bold text-indigo-700 uppercase text-xs mb-2 tracking-widest flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Socratic Prompt
                  </p>
                  <p className="text-slate-800 font-semibold italic text-base">"{submission.feedback?.socraticQuestion}"</p>
                </div>

                <div className="bg-slate-900/5 p-4 rounded-xl text-xs space-y-2">
                  <div>
                    <p className="font-bold uppercase tracking-tight opacity-50 mb-1">AI Analysis:</p>
                    <p className="text-slate-800">{submission.feedback?.aiNotes}</p>
                  </div>
                  <hr className="border-slate-300/50" />
                  <div>
                    <p className="font-bold uppercase tracking-tight opacity-50 mb-1">Standard Guidance:</p>
                    <p className="italic text-slate-700">{question.guidance}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
