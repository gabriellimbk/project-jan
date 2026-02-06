
import React from 'react';
import { AppState } from '../types';

interface HeaderProps {
  currentStep: AppState;
  onViewChange: (state: AppState) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, onViewChange }) => {
  const isTeacher = currentStep === AppState.TEACHER;

  return (
    <header className="bg-indigo-700 text-white py-4 shadow-lg mb-8 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className="cursor-pointer"
            onClick={() => onViewChange(AppState.WELCOME)}
          >
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Linguistics Lab</h1>
            <p className="text-indigo-100 text-xs opacity-90 hidden sm:block">Self-Check Submission Tool</p>
          </div>
        </div>

        <div className="flex bg-indigo-800/50 p-1 rounded-xl border border-indigo-400/20">
          <button
            onClick={() => onViewChange(AppState.WELCOME)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              !isTeacher ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-100 hover:text-white'
            }`}
          >
            Student View
          </button>
          <button
            onClick={() => onViewChange(AppState.TEACHER)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              isTeacher ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-100 hover:text-white'
            }`}
          >
            Teacher Console
          </button>
        </div>
      </div>
    </header>
  );
};
