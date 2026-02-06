import React, { useMemo, useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { ProgressTracker } from './components/ProgressTracker';
import { SummaryView } from './components/SummaryView';
import { TeacherConsole } from './components/TeacherConsole';
import { QUESTIONS } from './constants';
import { AppState, Submission, StudentSession } from './types';
import { evaluateSubmission } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  sessions: 'linguistics_lab_sessions',
  lastUser: 'linguistics_lab_last_user'
};

type StoredProgress = {
  studentName: string;
  submissions: Record<string, Submission>;
  currentQuestionIndex: number;
  currentStep: AppState;
  updatedAt: number;
};

const normalizeUser = (name: string) => name.trim().toLowerCase();
const progressKeyFor = (name: string) => `linguistics_lab_progress_${normalizeUser(name)}`;
const getRedirectUserId = () => {
  const params = new URLSearchParams(window.location.search);
  const keys = ['userId', 'user_id', 'id', 'uid'];
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.WELCOME);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [allSessions, setAllSessions] = useState<StudentSession[]>([]);
  const [currentStudentName, setCurrentStudentName] = useState('');
  const [hasStudentAccess, setHasStudentAccess] = useState<boolean | null>(null);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherOtp, setTeacherOtp] = useState('');
  const [teacherAuthError, setTeacherAuthError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [teacherSession, setTeacherSession] = useState<Session | null>(null);

  // Persist sessions in local storage for a "real" feel during demo
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sessions);
    if (saved) {
      try {
        setAllSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }

    const redirectUserId = getRedirectUserId();
    if (redirectUserId) {
      setHasStudentAccess(true);
      setCurrentStudentName(redirectUserId);
      localStorage.setItem(STORAGE_KEYS.lastUser, redirectUserId);

      const raw = localStorage.getItem(progressKeyFor(redirectUserId));
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as StoredProgress;
          setSubmissions(parsed.submissions || {});
          setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
          setCurrentStep(parsed.currentStep || AppState.QUIZ);
        } catch (e) {
          console.error("Failed to parse progress", e);
          setCurrentStep(AppState.WELCOME);
        }
      } else {
        setCurrentStep(AppState.WELCOME);
      }
    } else {
      setHasStudentAccess(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(allSessions));
  }, [allSessions]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setTeacherSession(data.session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTeacherSession(session);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const savedProgress = useMemo(() => {
    if (!currentStudentName.trim()) return null;
    const raw = localStorage.getItem(progressKeyFor(currentStudentName));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredProgress;
    } catch (e) {
      console.error("Failed to parse progress", e);
      return null;
    }
  }, [currentStudentName]);

  const persistProgress = (stepOverride?: AppState) => {
    if (!currentStudentName) return;
    if (currentStep !== AppState.QUIZ && currentStep !== AppState.RESULTS) return;

    const payload: StoredProgress = {
      studentName: currentStudentName,
      submissions,
      currentQuestionIndex,
      currentStep: stepOverride || currentStep,
      updatedAt: Date.now()
    };
    localStorage.setItem(progressKeyFor(currentStudentName), JSON.stringify(payload));
  };

  useEffect(() => {
    persistProgress();
  }, [submissions, currentQuestionIndex, currentStep, currentStudentName]);

  const startNewSession = () => {
    setSubmissions({});
    setCurrentQuestionIndex(0);
    setCurrentStep(AppState.QUIZ);
  };

  const clearProgressForCurrentUser = () => {
    if (!currentStudentName) return;
    localStorage.removeItem(progressKeyFor(currentStudentName));
  };

  const handleSendTeacherOtp = async () => {
    const email = teacherEmail.trim();
    if (!email || !email.includes('@')) {
      setTeacherAuthError('Enter a valid email address.');
      return;
    }
    if (!email.toLowerCase().endsWith('@ri.edu.sg')) {
      setTeacherAuthError('Teacher email must end with @ri.edu.sg.');
      return;
    }
    setTeacherAuthError('');
    setIsSendingOtp(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    setIsSendingOtp(false);
    if (error) {
      setTeacherAuthError(error.message);
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyTeacherOtp = async () => {
    const email = teacherEmail.trim();
    const token = teacherOtp.trim();
    if (!email || !email.includes('@')) {
      setTeacherAuthError('Enter a valid email address.');
      return;
    }
    if (!email.toLowerCase().endsWith('@ri.edu.sg')) {
      setTeacherAuthError('Teacher email must end with @ri.edu.sg.');
      return;
    }
    if (token.length !== 6) {
      setTeacherAuthError('Enter the 6 digit code from your email.');
      return;
    }
    setTeacherAuthError('');
    setIsVerifyingOtp(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    setIsVerifyingOtp(false);
    if (error) {
      setTeacherAuthError(error.message);
      return;
    }
    setTeacherOtp('');
  };

  const handleTeacherSignOut = async () => {
    await supabase.auth.signOut();
    setTeacherSession(null);
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setSubmissions(prev => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { questionId: qId, answer: '', isSubmitting: false }),
        answer: value
      }
    }));
  };

  const handleSubmitAnswer = async (qId: string) => {
    const question = QUESTIONS.find(q => q.id === qId);
    const submission = submissions[qId];
    if (!question || !submission) return;

    setSubmissions(prev => ({
      ...prev,
      [qId]: { ...prev[qId], isSubmitting: true }
    }));

    const feedback = await evaluateSubmission(question, submission.answer);

    setSubmissions(prev => ({
      ...prev,
      [qId]: { ...prev[qId], isSubmitting: false, feedback }
    }));
  };

  const finishQuiz = () => {
    // Save this session to the "Teacher" pool
    const totalScore = QUESTIONS.reduce((acc, q) => acc + (submissions[q.id]?.feedback?.score || 0), 0);
    const maxScore = QUESTIONS.reduce((acc, q) => acc + q.points, 0);

    const newSession: StudentSession = {
      id: Date.now().toString(),
      studentName: currentStudentName,
      timestamp: Date.now(),
      submissions: { ...submissions },
      totalScore,
      maxScore
    };

    setAllSessions(prev => [newSession, ...prev]);
    setCurrentStep(AppState.RESULTS);
    persistProgress(AppState.RESULTS);
  };

  const goToNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const currentSubmission = submissions[currentQuestion.id] || { 
    questionId: currentQuestion.id, 
    answer: '', 
    isSubmitting: false 
  };
  
  const isQuestionAnswered = !!currentSubmission.feedback;
  const completedCount = QUESTIONS.filter(q => !!submissions[q.id]?.feedback).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header currentStep={currentStep} onViewChange={setCurrentStep} />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pb-20">
        {hasStudentAccess === false && currentStep !== AppState.TEACHER && (
          <div className="text-center bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto mt-10">
            <div className="mb-6 inline-flex p-5 bg-indigo-50 rounded-3xl text-indigo-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3zM6 21v-1a6 6 0 0112 0v1" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Access Required</h2>
            <p className="text-slate-500 text-lg mb-6 leading-relaxed">
              Please access this app through the school portal so your user ID is included.
            </p>
            <button 
              onClick={() => setCurrentStep(AppState.TEACHER)}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm py-2 px-6 transition-colors"
            >
              Teacher Console
            </button>
          </div>
        )}

        {hasStudentAccess && currentStep === AppState.WELCOME && (
          <div className="text-center bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto mt-10">
            <div className="mb-6 inline-flex p-5 bg-indigo-50 rounded-3xl text-indigo-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.582.477 5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Sapir-Whorf Check-in</h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              Analyze how language shapes our reality. Complete the self-check to see where your understanding stands.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={startNewSession}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-1"
              >
                Start New Session
              </button>
              {savedProgress && (
                <button 
                  onClick={() => setCurrentStep(savedProgress.currentStep || AppState.QUIZ)}
                  className="bg-white border border-indigo-200 text-indigo-700 font-bold py-3 px-10 rounded-2xl transition-all hover:bg-indigo-50"
                >
                  Resume Saved Progress
                </button>
              )}
              <button 
                onClick={() => setCurrentStep(AppState.TEACHER)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm py-2 px-6 transition-colors"
              >
                Already a teacher? View insights →
              </button>
            </div>
          </div>
        )}

        {hasStudentAccess && currentStep === AppState.QUIZ && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Student</h3>
                <p className="font-bold text-indigo-600 text-lg">{currentStudentName}</p>
              </div>
            </div>
            <ProgressTracker current={completedCount} total={QUESTIONS.length} />
            
            <QuestionCard 
              question={currentQuestion}
              submission={currentSubmission}
              onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
              onSubmit={() => handleSubmitAnswer(currentQuestion.id)}
            />

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 text-indigo-600 font-bold disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-indigo-50 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              
              {isQuestionAnswered && (
                <button
                  onClick={goToNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  {currentQuestionIndex === QUESTIONS.length - 1 ? 'Finish & Save Results' : 'Next Question →'}
                </button>
              )}
            </div>
          </div>
        )}

        {hasStudentAccess && currentStep === AppState.RESULTS && (
          <SummaryView 
            submissions={submissions}
            questions={QUESTIONS}
            onRestart={() => {
              clearProgressForCurrentUser();
              startNewSession();
            }}
          />
        )}

        {currentStep === AppState.TEACHER && (
          <div className="max-w-5xl mx-auto">
            {!teacherSession ? (
              <div className="text-center bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto mt-6">
                <div className="mb-6 inline-flex p-5 bg-indigo-50 rounded-3xl text-indigo-600">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3zM6 21v-1a6 6 0 0112 0v1" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Teacher Login</h2>
                <p className="text-slate-500 text-lg mb-6 leading-relaxed">
                  Enter your email to receive a 6 digit code.
                </p>
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                  <input
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="teacher@ri.edu.sg"
                    className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {otpSent && (
                    <input
                      value={teacherOtp}
                      onChange={(e) => setTeacherOtp(e.target.value)}
                      placeholder="6 digit code"
                      inputMode="numeric"
                      className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                  {teacherAuthError && (
                    <div className="text-sm text-rose-600">{teacherAuthError}</div>
                  )}
                  <button
                    onClick={handleSendTeacherOtp}
                    disabled={isSendingOtp}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-70"
                  >
                    {isSendingOtp ? 'Sending Code...' : (otpSent ? 'Resend Code' : 'Send Code')}
                  </button>
                  {otpSent && (
                    <button
                      onClick={handleVerifyTeacherOtp}
                      disabled={isVerifyingOtp}
                      className="bg-white border border-indigo-200 text-indigo-700 font-bold py-3 px-10 rounded-2xl transition-all hover:bg-indigo-50 disabled:opacity-70"
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Signed In</p>
                    <p className="text-slate-700 font-bold">{teacherSession.user.email}</p>
                  </div>
                  <button
                    onClick={handleTeacherSignOut}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Sign out
                  </button>
                </div>
                <TeacherConsole 
                  sessions={allSessions}
                  questions={QUESTIONS}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-slate-400 text-xs border-t border-slate-100">
        &copy; {new Date().getFullYear()} Linguistics Lab • Teacher & Student Portal • Powered by Gemini AI
      </footer>
    </div>
  );
};

export default App;
