
import React from 'react';
import { Submission, Question } from '../types';

interface SummaryViewProps {
  submissions: Record<string, Submission>;
  questions: Question[];
  onRestart: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ submissions, questions, onRestart }) => {
  // Use questions array to calculate total score to ensure correct type inference for sub.feedback?.score
  const totalScore = questions.reduce((acc, q) => {
    const sub = submissions[q.id];
    return acc + (sub?.feedback?.score || 0);
  }, 0);
  const maxScore = questions.reduce((acc, q) => acc + q.points, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-indigo-700 py-12 px-6 text-center text-white">
        <div className="mb-4 inline-block p-4 bg-white/20 rounded-full">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Check-in Complete!</h2>
        <p className="text-indigo-100 opacity-90">Great job reviewing the Sapir-Whorf Hypothesis.</p>
        
        <div className="mt-8 flex justify-center items-baseline gap-2">
          <span className="text-6xl font-black">{totalScore}</span>
          <span className="text-2xl font-medium opacity-60">/ {maxScore}</span>
        </div>
        <div className="text-sm mt-1 uppercase tracking-widest font-bold opacity-70">Total Points Earned</div>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Review</h3>
          <div className="space-y-3">
            {questions.map((q) => {
              const sub = submissions[q.id];
              const isReinforcement = sub?.feedback?.status === 'reinforcement';
              return (
                <div key={q.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600 font-medium">{q.number}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isReinforcement ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {sub?.feedback?.score ?? 0} / {q.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={onRestart}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Review All Answers Again
        </button>
      </div>
    </div>
  );
};
