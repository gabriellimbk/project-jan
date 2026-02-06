
import React, { useState } from 'react';
import { StudentSession, Question } from '../types';

interface TeacherConsoleProps {
  sessions: StudentSession[];
  questions: Question[];
}

type GroupMode = 'question' | 'submission';

export const TeacherConsole: React.FC<TeacherConsoleProps> = ({ sessions, questions }) => {
  const [mode, setMode] = useState<GroupMode>('question');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleQuestion = (id: string) => {
    const next = new Set(expandedQuestions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedQuestions(next);
  };

  const toggleSession = (id: string) => {
    const next = new Set(expandedSessions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSessions(next);
  };

  const expandAll = () => {
    if (mode === 'question') {
      setExpandedQuestions(new Set(questions.map(q => q.id)));
    } else {
      setExpandedSessions(new Set(sessions.map(s => s.id)));
    }
  };

  const collapseAll = () => {
    if (mode === 'question') {
      setExpandedQuestions(new Set());
    } else {
      setExpandedSessions(new Set());
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
        <div className="text-slate-300 mb-4 flex justify-center">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-400">No student submissions yet.</h3>
        <p className="text-slate-400 max-w-xs mx-auto mt-2">Check back once students have completed their self-checks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Teacher Insights</h2>
          <p className="text-slate-500">Review class progress and specific responses.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <button onClick={expandAll} className="hover:text-indigo-600 transition-colors">Expand All</button>
            <span>•</span>
            <button onClick={collapseAll} className="hover:text-indigo-600 transition-colors">Collapse All</button>
          </div>
          <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner border border-slate-300/50">
            <button
              onClick={() => setMode('question')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'question' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              By Questions
            </button>
            <button
              onClick={() => setMode('submission')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'submission' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              By User Submission
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {mode === 'question' ? (
          questions.map((q) => {
            const relatedSubmissions = sessions
              .map(s => ({ student: s.studentName, sub: s.submissions[q.id] }))
              .filter(item => item.sub && item.sub.feedback);
            const isExpanded = expandedQuestions.has(q.id);

            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                <button 
                  onClick={() => toggleQuestion(q.id)}
                  className="w-full text-left bg-slate-50 px-6 py-5 flex justify-between items-center hover:bg-slate-100/80 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shrink-0">{q.number}</span>
                    <h3 className="font-bold text-slate-800 truncate">{q.text}</h3>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                      {relatedSubmissions.length} {relatedSubmissions.length === 1 ? 'Response' : 'Responses'}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="divide-y divide-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {relatedSubmissions.length > 0 ? (
                      relatedSubmissions.map((item, idx) => (
                        <div key={idx} className="p-6 hover:bg-slate-50/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-indigo-600 text-sm">{item.student}</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${
                              item.sub.feedback?.status === 'reinforcement' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              Score: {item.sub.feedback?.score}/{q.points}
                            </span>
                          </div>
                          <p className="text-slate-700 text-sm italic mb-4 border-l-2 border-slate-200 pl-4 py-1 leading-relaxed">"{item.sub.answer}"</p>
                          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">AI Insight</p>
                            <p className="text-xs text-slate-600 font-medium">{item.sub.feedback?.aiNotes}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-slate-400 text-sm italic">
                        No answers submitted for this question yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          sessions.map((session) => {
            const isExpanded = expandedSessions.has(session.id);
            return (
              <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                <button 
                  onClick={() => toggleSession(session.id)}
                  className="w-full text-left bg-indigo-50/50 px-6 py-5 flex justify-between items-center hover:bg-indigo-50 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {session.studentName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-800">{session.studentName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{new Date(session.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-lg font-black text-indigo-700 leading-none">{session.totalScore}/{session.maxScore}</div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Grade</p>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-slate-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 sm:hidden bg-indigo-50/30 border-b border-indigo-100 flex justify-between items-center">
                       <p className="text-xs font-bold text-slate-500 uppercase">Final Grade</p>
                       <p className="text-lg font-black text-indigo-700">{session.totalScore}/{session.maxScore}</p>
                    </div>
                    {questions.map((q) => {
                      const sub = session.submissions[q.id];
                      if (!sub || !sub.feedback) return null;
                      return (
                        <div key={q.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded shadow-sm">{q.number}</span>
                            <p className="text-sm font-bold text-slate-800 truncate">{q.text}</p>
                          </div>
                          <p className="text-sm text-slate-600 italic mb-4 leading-relaxed border-l-2 border-indigo-100 pl-4">"{sub.answer}"</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span className={`self-start text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter ${
                              sub.feedback.status === 'reinforcement' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              Score: {sub.feedback.score}/{q.points}
                            </span>
                            <div className="bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50 flex-1">
                              <p className="text-[11px] text-slate-500 font-medium italic">"{sub.feedback.aiNotes}"</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
